import fs from 'fs/promises';
import path from 'path';
import { GeminiService } from './geminiService';

/**
 * Interface for test case result
 */
interface TestCaseResult {
  testCase: string;
  result: any;
  metrics: {
    processingTime: number;
    overallConfidence: number;
    completeness: number;
    consistency: number;
    clarity: number;
    agentCount: number;
    toolCount: number;
    relationshipCount: number;
    overallAccuracy?: number;
  };
  timestamp: string;
}

/**
 * Interface for error result
 */
interface ErrorResult {
  success: false;
  message: string;
}

/**
 * Type for test case return value
 */
type TestCaseReturn = TestCaseResult | ErrorResult;

/**
 * Service for testing and optimizing prompt engineering
 */
export class PromptTestingService {
  private geminiService: GeminiService;
  private testCasePath: string = path.join(__dirname, '../../tests/testCases');
  private resultsPath: string = path.join(__dirname, '../../tests/results');
  
  constructor() {
    this.geminiService = new GeminiService();
    this.initializeDirectories();
  }
  
  /**
   * Initialize directories for test cases and results
   */
  private async initializeDirectories() {
    try {
      await fs.mkdir(this.testCasePath, { recursive: true });
      await fs.mkdir(this.resultsPath, { recursive: true });
    } catch (error) {
      console.error('Error initializing directories:', error);
    }
  }
  
  /**
   * Save a system description as a test case
   * @param name - Name of the test case
   * @param description - System description
   * @returns Success message
   */
  async saveTestCase(name: string, description: string): Promise<{ success: boolean; message: string }> {
    try {
      const filePath = path.join(this.testCasePath, `${name}.json`);
      await fs.writeFile(filePath, JSON.stringify({ name, description }, null, 2));
      return { success: true, message: `Test case '${name}' saved successfully` };
    } catch (error: any) {
      console.error('Error saving test case:', error);
      return { success: false, message: error.message };
    }
  }
  
  /**
   * List all available test cases
   * @returns Array of test case names
   */
  async listTestCases(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.testCasePath);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
    } catch (error) {
      console.error('Error listing test cases:', error);
      return [];
    }
  }
  
  /**
   * Check if the result is an error result
   * @param result - Result to check
   * @returns True if the result is an error result
   */
  private isErrorResult(result: TestCaseReturn): result is ErrorResult {
    return 'success' in result && result.success === false;
  }
  
  /**
   * Run a single test case through the Gemini service
   * @param testCaseName - Name of the test case to run
   * @returns Test results
   */
  async runTestCase(testCaseName: string): Promise<TestCaseReturn> {
    try {
      const filePath = path.join(this.testCasePath, `${testCaseName}.json`);
      const fileData = await fs.readFile(filePath, 'utf8');
      const testCase = JSON.parse(fileData);
      
      const startTime = Date.now();
      const result = await this.geminiService.processInitialDescription(testCase.description);
      const processingTime = Date.now() - startTime;
      
      // Add metrics to the result
      const testResult: TestCaseResult = {
        testCase: testCaseName,
        result,
        metrics: {
          processingTime,
          overallConfidence: result.systemConfidence?.overall || 0,
          completeness: result.systemConfidence?.completeness || 0,
          consistency: result.systemConfidence?.consistency || 0,
          clarity: result.systemConfidence?.clarity || 0,
          agentCount: result.agents?.length || 0,
          toolCount: result.tools?.length || 0,
          relationshipCount: result.relationships?.length || 0
        },
        timestamp: new Date().toISOString()
      };
      
      // Save the result
      const resultPath = path.join(this.resultsPath, `${testCaseName}_${Date.now()}.json`);
      await fs.writeFile(resultPath, JSON.stringify(testResult, null, 2));
      
      return testResult;
    } catch (error: any) {
      console.error('Error running test case:', error);
      return { success: false, message: error.message };
    }
  }
  
  /**
   * Run multiple test cases and compare results
   * @param testCaseNames - Array of test case names to run
   * @returns Aggregated results
   */
  async runBatchTests(testCaseNames: string[]) {
    const results: TestCaseResult[] = [];
    const metrics = {
      averageConfidence: 0,
      averageProcessingTime: 0,
      successRate: 0,
      totalAgents: 0,
      totalTools: 0,
      totalRelationships: 0
    };
    
    let successCount = 0;
    
    for (const testCase of testCaseNames) {
      try {
        const result = await this.runTestCase(testCase);
        if (!this.isErrorResult(result)) {
          results.push(result);
          metrics.averageConfidence += result.metrics.overallConfidence;
          metrics.averageProcessingTime += result.metrics.processingTime;
          metrics.totalAgents += result.metrics.agentCount;
          metrics.totalTools += result.metrics.toolCount;
          metrics.totalRelationships += result.metrics.relationshipCount;
          successCount++;
        }
      } catch (error) {
        console.error(`Error running test case ${testCase}:`, error);
      }
    }
    
    // Calculate averages
    const testCount = results.length;
    if (testCount > 0) {
      metrics.averageConfidence /= testCount;
      metrics.averageProcessingTime /= testCount;
      metrics.successRate = (successCount / testCaseNames.length) * 100;
    }
    
    // Save the batch results
    const batchResult = {
      testCases: testCaseNames,
      metrics,
      individualResults: results,
      timestamp: new Date().toISOString()
    };
    
    const batchPath = path.join(this.resultsPath, `batch_${Date.now()}.json`);
    await fs.writeFile(batchPath, JSON.stringify(batchResult, null, 2));
    
    return batchResult;
  }
  
  /**
   * Evaluate the quality of an extraction by comparing to expected values
   * @param testCaseName - Name of the test case
   * @param expectedValues - Expected values to compare against
   * @returns Evaluation results
   */
  async evaluateExtraction(testCaseName: string, expectedValues: any) {
    try {
      const result = await this.runTestCase(testCaseName);
      
      if (this.isErrorResult(result)) {
        return { success: false, message: 'Test case execution failed' };
      }
      
      const actual = result.result;
      const evaluation = {
        testCase: testCaseName,
        metrics: {
          ...result.metrics
        },
        accuracy: {
          agents: this.calculateEntityAccuracy(actual.agents || [], expectedValues.agents || []),
          tools: this.calculateEntityAccuracy(actual.tools || [], expectedValues.tools || []),
          relationships: this.calculateEntityAccuracy(actual.relationships || [], expectedValues.relationships || []),
          orchestrationPattern: actual.orchestrationPattern?.type === expectedValues.orchestrationPattern?.type ? 1 : 0
        },
        timestamp: new Date().toISOString()
      };
      
      // Calculate overall accuracy
      const accuracyValues = Object.values(evaluation.accuracy) as number[];
      evaluation.metrics.overallAccuracy = accuracyValues.reduce((sum, val) => sum + val, 0) / accuracyValues.length;
      
      // Save the evaluation
      const evalPath = path.join(this.resultsPath, `eval_${testCaseName}_${Date.now()}.json`);
      await fs.writeFile(evalPath, JSON.stringify(evaluation, null, 2));
      
      return evaluation;
    } catch (error: any) {
      console.error('Error evaluating extraction:', error);
      return { success: false, message: error.message };
    }
  }
  
  /**
   * Calculate the accuracy of extracted entities compared to expected entities
   * @param actual - Actual entities extracted
   * @param expected - Expected entities
   * @returns Accuracy score (0-1)
   */
  private calculateEntityAccuracy(actual: any[], expected: any[]): number {
    if (expected.length === 0) {
      return actual.length === 0 ? 1 : 0;
    }
    
    if (actual.length === 0) {
      return 0;
    }
    
    let matchCount = 0;
    
    for (const expectedEntity of expected) {
      // Find best match for this expected entity
      let bestMatchScore = 0;
      
      for (const actualEntity of actual) {
        const matchScore = this.calculateEntityMatchScore(actualEntity, expectedEntity);
        if (matchScore > bestMatchScore) {
          bestMatchScore = matchScore;
        }
      }
      
      matchCount += bestMatchScore;
    }
    
    return matchCount / expected.length;
  }
  
  /**
   * Calculate a match score between two entities
   * @param actual - Actual entity
   * @param expected - Expected entity
   * @returns Match score (0-1)
   */
  private calculateEntityMatchScore(actual: any, expected: any): number {
    // For simple objects, calculate based on common keys
    const allKeys = new Set([...Object.keys(actual), ...Object.keys(expected)]);
    let matchScore = 0;
    let totalKeys = 0;
    
    for (const key of allKeys) {
      if (typeof expected[key] !== 'undefined') {
        totalKeys++;
        
        if (typeof actual[key] !== 'undefined') {
          if (Array.isArray(expected[key]) && Array.isArray(actual[key])) {
            // For arrays, calculate overlap
            const expectedSet = new Set(expected[key]);
            const matchingItems = actual[key].filter(item => expectedSet.has(item));
            matchScore += matchingItems.length / Math.max(expected[key].length, actual[key].length);
          } else if (typeof expected[key] === 'object' && expected[key] !== null && 
                     typeof actual[key] === 'object' && actual[key] !== null) {
            // For nested objects, recursive call
            matchScore += this.calculateEntityMatchScore(actual[key], expected[key]);
          } else if (expected[key] === actual[key]) {
            // Exact match
            matchScore += 1;
          } else if (typeof expected[key] === 'string' && typeof actual[key] === 'string') {
            // String similarity
            const similarity = this.calculateStringSimilarity(
              expected[key].toLowerCase(), 
              actual[key].toLowerCase()
            );
            matchScore += similarity > 0.7 ? similarity : 0;
          }
        }
      }
    }
    
    return totalKeys > 0 ? matchScore / totalKeys : 0;
  }
  
  /**
   * Calculate similarity between two strings
   * @param str1 - First string
   * @param str2 - Second string
   * @returns Similarity score (0-1)
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;
    
    // Simple Jaccard similarity for words
    const words1 = new Set(str1.split(/\s+/));
    const words2 = new Set(str2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }
} 