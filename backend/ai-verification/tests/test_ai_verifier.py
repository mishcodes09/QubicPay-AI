"""
Integration Test Suite
Tests the complete flow from AI verification to Oracle submission
"""
import requests
import time
import json
from typing import Dict, Any

class IntegrationTester:
    def __init__(self):
        self.ai_service_url = "http://localhost:5000"
        self.oracle_url = "http://localhost:8080"
        self.results = []
    
    def run_all_tests(self):
        """Run complete integration test suite"""
        print("=" * 70)
        print("  Qubic Smart Escrow - Integration Test Suite")
        print("=" * 70)
        print()
        
        tests = [
            ("Service Health Checks", self.test_health_checks),
            ("Legitimate Campaign Flow", self.test_legitimate_flow),
            ("Bot Fraud Detection Flow", self.test_bot_fraud_flow),
            ("Mixed Quality Flow", self.test_mixed_quality_flow),
            ("Score Threshold Validation", self.test_threshold_validation),
            ("Error Handling", self.test_error_handling)
        ]
        
        passed = 0
        failed = 0
        
        for name, test_func in tests:
            print(f"Running: {name}")
            try:
                test_func()
                print(f"✓ PASSED: {name}")
                passed += 1
            except AssertionError as e:
                print(f"✗ FAILED: {name} - {str(e)}")
                failed += 1
            except Exception as e:
                print(f"✗ ERROR: {name} - {str(e)}")
                failed += 1
            print()
        
        print("=" * 70)
        print(f"Test Results: {passed} passed, {failed} failed")
        print("=" * 70)
        
        return failed == 0
    
    def test_health_checks(self):
        """Test service availability"""
        # AI Service
        response = requests.get(f"{self.ai_service_url}/health", timeout=5)
        assert response.status_code == 200, "AI Service not responding"
        data = response.json()
        assert data['status'] == 'healthy', "AI Service not healthy"
        
        # Oracle Agent
        response = requests.get(f"{self.oracle_url}/health", timeout=5)
        assert response.status_code == 200, "Oracle Agent not responding"
        data = response.json()
        assert data['status'] == 'healthy', "Oracle Agent not healthy"
    
    def test_legitimate_flow(self):
        """Test legitimate campaign verification flow"""
        # Step 1: AI Verification
        ai_request = {
            "post_url": "https://instagram.com/p/legitimate_integration_test",
            "scenario": "legitimate"
        }
        
        response = requests.post(
            f"{self.ai_service_url}/verify",
            json=ai_request,
            timeout=10
        )
        assert response.status_code == 200, "AI verification failed"
        
        ai_result = response.json()
        print(f"  AI Score: {ai_result['overall_score']}/100")
        print(f"  Recommendation: {ai_result['recommendation']}")
        
        # Validate AI result
        assert ai_result['overall_score'] >= 95, f"Expected score >=95, got {ai_result['overall_score']}"
        assert ai_result['passed'] is True, "Expected passed=True"
        assert 'APPROVED' in ai_result['recommendation'], "Expected APPROVED recommendation"
        
        # Step 2: Oracle Submission (manual endpoint for testing)
        oracle_request = {
            "postUrl": ai_request['post_url'],
            "scenario": ai_request['scenario']
        }
        
        response = requests.post(
            f"{self.oracle_url}/verify",
            json=oracle_request,
            timeout=30
        )
        
        if response.status_code == 200:
            oracle_result = response.json()
            print(f"  Oracle TX Status: {oracle_result.get('success', 'N/A')}")
            assert oracle_result['score'] == ai_result['overall_score'], "Score mismatch"
    
    def test_bot_fraud_flow(self):
        """Test bot fraud detection flow"""
        ai_request = {
            "post_url": "https://instagram.com/p/bot_fraud_integration_test",
            "scenario": "bot_fraud"
        }
        
        response = requests.post(
            f"{self.ai_service_url}/verify",
            json=ai_request,
            timeout=10
        )
        assert response.status_code == 200, "AI verification failed"
        
        ai_result = response.json()
        print(f"  AI Score: {ai_result['overall_score']}/100")
        print(f"  Fraud Flags: {len(ai_result['fraud_flags'])}")
        print(f"  Recommendation: {ai_result['recommendation']}")
        
        # Validate detection
        assert ai_result['overall_score'] < 60, f"Expected score <60, got {ai_result['overall_score']}"
        assert ai_result['passed'] is False, "Expected passed=False"
        assert len(ai_result['fraud_flags']) > 0, "Expected fraud flags"
        assert 'REJECT' in ai_result['recommendation'] or 'HOLD' in ai_result['recommendation'], \
            "Expected REJECT or HOLD recommendation"
    
    def test_mixed_quality_flow(self):
        """Test mixed quality campaign"""
        ai_request = {
            "post_url": "https://instagram.com/p/mixed_integration_test",
            "scenario": "mixed_quality"
        }
        
        response = requests.post(
            f"{self.ai_service_url}/verify",
            json=ai_request,
            timeout=10
        )
        assert response.status_code == 200, "AI verification failed"
        
        ai_result = response.json()
        print(f"  AI Score: {ai_result['overall_score']}/100")
        print(f"  Recommendation: {ai_result['recommendation']}")
        
        # Should be in middle range
        assert 60 <= ai_result['overall_score'] < 95, \
            f"Expected score 60-95, got {ai_result['overall_score']}"
    
    def test_threshold_validation(self):
        """Test score threshold logic"""
        # Get thresholds
        response = requests.get(f"{self.ai_service_url}/thresholds", timeout=5)
        assert response.status_code == 200, "Failed to get thresholds"
        
        data = response.json()
        print(f"  Pass Threshold: {data['thresholds']['overall_pass_score']}")
        print(f"  Weights: {data['weights']}")
        
        # Verify weights sum to 1.0
        weight_sum = sum(data['weights'].values())
        assert abs(weight_sum - 1.0) < 0.001, f"Weights must sum to 1.0, got {weight_sum}"
    
    def test_error_handling(self):
        """Test error handling"""
        # Test missing post_url
        response = requests.post(
            f"{self.ai_service_url}/verify",
            json={},
            timeout=5
        )
        assert response.status_code == 400, "Expected 400 for missing post_url"
        
        # Test invalid scenario
        response = requests.post(
            f"{self.ai_service_url}/verify",
            json={
                "post_url": "https://test.com/p/test",
                "scenario": "invalid_scenario"
            },
            timeout=5
        )
        assert response.status_code == 400, "Expected 400 for invalid scenario"
        
        print("  ✓ Error handling works correctly")

def main():
    """Main test execution"""
    tester = IntegrationTester()
    
    # Check services are running
    try:
        requests.get("http://localhost:5000/health", timeout=2)
        requests.get("http://localhost:8080/health", timeout=2)
    except requests.exceptions.RequestException:
        print("ERROR: Services not running. Please start backend services first:")
        print("  ./scripts/start-backend.sh")
        return False
    
    # Run tests
    success = tester.run_all_tests()
    
    return success

if __name__ == "__main__":
    import sys
    success = main()
    sys.exit(0 if success else 1)