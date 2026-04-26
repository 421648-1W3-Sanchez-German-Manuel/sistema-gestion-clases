#!/usr/bin/env python3
"""
Comprehensive backend API testing for Sistema de Gestión de Clases
Tests all CRUD operations and workflows
"""

import requests
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

class ClassManagementTester:
    def __init__(self, base_url: str = "https://smart-repo-creator.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_entities = {
            'teachers': [],
            'class_types': [],
            'classes': [],
            'classrooms': [],
            'students': [],
            'schedules': [],
            'enrollments': [],
            'billing': []
        }

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, expected_status: int = 200) -> tuple[bool, Dict]:
        """Make HTTP request with authentication"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        cookies = {}
        
        if self.token:
            cookies['session_token'] = self.token

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, cookies=cookies)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, cookies=cookies)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, cookies=cookies)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, cookies=cookies)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            success = response.status_code == expected_status
            try:
                response_data = response.json()
            except:
                response_data = {"status_code": response.status_code, "text": response.text}

            return success, response_data

        except Exception as e:
            return False, {"error": str(e)}

    def test_login(self) -> bool:
        """Test login with admin credentials"""
        print("\n🔐 Testing Authentication...")
        
        # Make login request without token
        url = f"{self.base_url}/api/auth/login"
        headers = {'Content-Type': 'application/json'}
        
        try:
            response = requests.post(url, json={"email": "admin@sistema.com", "password": "Admin1234!"}, headers=headers)
            
            if response.status_code == 200:
                response_data = response.json()
                
                # Extract token from cookies
                cookies = response.cookies
                if 'session_token' in cookies:
                    self.token = cookies['session_token']
                    self.log_test("Login with admin credentials", True)
                    return True
                else:
                    self.log_test("Login with admin credentials", False, "No session token in cookies")
                    return False
            else:
                self.log_test("Login with admin credentials", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Login with admin credentials", False, str(e))
            return False

    def test_dashboard(self) -> bool:
        """Test dashboard endpoint"""
        print("\n📊 Testing Dashboard...")
        
        success, response = self.make_request('GET', 'dashboard')
        
        if success and 'active_classes' in response:
            self.log_test("Dashboard data retrieval", True)
            return True
        else:
            self.log_test("Dashboard data retrieval", False, str(response))
            return False

    def test_teachers_crud(self) -> bool:
        """Test Teachers CRUD operations"""
        print("\n👨‍🏫 Testing Teachers CRUD...")
        
        # Create teacher
        teacher_data = {
            "name": "Prof. García",
            "email": "garcia@sistema.com",
            "phone": "+1234567890"
        }
        
        success, response = self.make_request('POST', 'teachers', data=teacher_data, expected_status=200)
        if success and 'id' in response:
            teacher_id = response['id']
            self.created_entities['teachers'].append(teacher_id)
            self.log_test("Create teacher 'Prof. García'", True)
        else:
            self.log_test("Create teacher 'Prof. García'", False, str(response))
            return False

        # List teachers
        success, response = self.make_request('GET', 'teachers')
        if success and isinstance(response, list):
            self.log_test("List teachers", True)
        else:
            self.log_test("List teachers", False, str(response))

        # Update teacher
        update_data = {"phone": "+0987654321"}
        success, response = self.make_request('PUT', f'teachers/{teacher_id}', data=update_data)
        if success:
            self.log_test("Update teacher", True)
        else:
            self.log_test("Update teacher", False, str(response))

        return True

    def test_class_types_crud(self) -> bool:
        """Test Class Types CRUD operations"""
        print("\n🏷️ Testing Class Types CRUD...")
        
        # Create class type
        type_data = {
            "name": "Yoga",
            "description": "Clases de yoga para relajación y flexibilidad"
        }
        
        success, response = self.make_request('POST', 'class-types', data=type_data, expected_status=200)
        if success and 'id' in response:
            type_id = response['id']
            self.created_entities['class_types'].append(type_id)
            self.log_test("Create class type 'Yoga'", True)
        else:
            self.log_test("Create class type 'Yoga'", False, str(response))
            return False

        # List class types
        success, response = self.make_request('GET', 'class-types')
        if success and isinstance(response, list):
            self.log_test("List class types", True)
        else:
            self.log_test("List class types", False, str(response))

        return True

    def test_classrooms_crud(self) -> bool:
        """Test Classrooms CRUD operations"""
        print("\n🏢 Testing Classrooms CRUD...")
        
        # Create classroom
        room_data = {
            "name": "Salón A",
            "capacity": 30,
            "location": "Planta baja"
        }
        
        success, response = self.make_request('POST', 'classrooms', data=room_data, expected_status=200)
        if success and 'id' in response:
            room_id = response['id']
            self.created_entities['classrooms'].append(room_id)
            self.log_test("Create classroom 'Salón A'", True)
        else:
            self.log_test("Create classroom 'Salón A'", False, str(response))
            return False

        # List classrooms
        success, response = self.make_request('GET', 'classrooms')
        if success and isinstance(response, list):
            self.log_test("List classrooms", True)
        else:
            self.log_test("List classrooms", False, str(response))

        return True

    def test_classes_crud(self) -> bool:
        """Test Classes CRUD operations"""
        print("\n📚 Testing Classes CRUD...")
        
        if not self.created_entities['teachers'] or not self.created_entities['class_types']:
            print("❌ Cannot test classes - missing teachers or class types")
            return False
        
        # Create class
        class_data = {
            "name": "Yoga Matutino",
            "class_type_id": self.created_entities['class_types'][0],
            "teacher_id": self.created_entities['teachers'][0],
            "max_students": 3,
            "start_date": "2024-01-01",
            "end_date": "2024-12-31"
        }
        
        success, response = self.make_request('POST', 'classes', data=class_data, expected_status=200)
        if success and 'id' in response:
            class_id = response['id']
            self.created_entities['classes'].append(class_id)
            self.log_test("Create class 'Yoga Matutino'", True)
        else:
            self.log_test("Create class 'Yoga Matutino'", False, str(response))
            return False

        # List classes
        success, response = self.make_request('GET', 'classes')
        if success and isinstance(response, list):
            self.log_test("List classes", True)
        else:
            self.log_test("List classes", False, str(response))

        # Get class detail
        success, response = self.make_request('GET', f'classes/{class_id}')
        if success and 'id' in response:
            self.log_test("Get class detail", True)
        else:
            self.log_test("Get class detail", False, str(response))

        return True

    def test_students_crud(self) -> bool:
        """Test Students CRUD operations"""
        print("\n👥 Testing Students CRUD...")
        
        # Create students
        students_data = [
            {
                "name": "Ana Torres",
                "email": "ana.torres@email.com",
                "phone": "+1111111111",
                "birth_date": "1995-05-15"
            },
            {
                "name": "Carlos Pérez",
                "email": "carlos.perez@email.com",
                "phone": "+2222222222",
                "birth_date": "1990-08-20"
            }
        ]
        
        for student_data in students_data:
            success, response = self.make_request('POST', 'students', data=student_data, expected_status=200)
            if success and 'id' in response:
                student_id = response['id']
                self.created_entities['students'].append(student_id)
                self.log_test(f"Create student '{student_data['name']}'", True)
            else:
                self.log_test(f"Create student '{student_data['name']}'", False, str(response))

        # List students
        success, response = self.make_request('GET', 'students')
        if success and isinstance(response, list):
            self.log_test("List students", True)
        else:
            self.log_test("List students", False, str(response))

        return len(self.created_entities['students']) >= 2

    def test_schedules(self) -> bool:
        """Test Schedule creation"""
        print("\n📅 Testing Schedules...")
        
        if not self.created_entities['classrooms'] or not self.created_entities['classes']:
            print("❌ Cannot test schedules - missing classrooms or classes")
            return False
        
        # Create schedule for future date
        future_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        schedule_data = {
            "class_id": self.created_entities['classes'][0],
            "date": future_date,
            "start_time": "09:00",
            "end_time": "10:30"
        }
        
        room_id = self.created_entities['classrooms'][0]
        success, response = self.make_request('POST', f'classrooms/{room_id}/schedules', data=schedule_data, expected_status=200)
        if success and 'id' in response:
            schedule_id = response['id']
            self.created_entities['schedules'].append(schedule_id)
            self.log_test("Create schedule for future date", True)
        else:
            self.log_test("Create schedule for future date", False, str(response))
            return False

        # Get classroom schedules
        success, response = self.make_request('GET', f'classrooms/{room_id}/schedules')
        if success and isinstance(response, list):
            self.log_test("Get classroom schedules", True)
        else:
            self.log_test("Get classroom schedules", False, str(response))

        return True

    def test_enrollment(self) -> bool:
        """Test Student Enrollment"""
        print("\n📝 Testing Enrollment...")
        
        if not self.created_entities['students'] or not self.created_entities['classes']:
            print("❌ Cannot test enrollment - missing students or classes")
            return False
        
        # Enroll students in class
        class_id = self.created_entities['classes'][0]
        enrolled_count = 0
        
        for student_id in self.created_entities['students']:
            enroll_data = {"class_id": class_id}
            success, response = self.make_request('POST', f'students/{student_id}/enroll', data=enroll_data, expected_status=200)
            if success:
                enrolled_count += 1
                self.log_test(f"Enroll student in class", True)
            else:
                self.log_test(f"Enroll student in class", False, str(response))

        # Get class students
        success, response = self.make_request('GET', f'classes/{class_id}/students')
        if success and isinstance(response, list):
            self.log_test("Get class students", True)
            print(f"   Enrolled students: {len(response)}")
        else:
            self.log_test("Get class students", False, str(response))

        return enrolled_count > 0

    def test_attendance(self) -> bool:
        """Test Attendance Recording"""
        print("\n✅ Testing Attendance...")
        
        if not self.created_entities['schedules'] or not self.created_entities['students']:
            print("❌ Cannot test attendance - missing schedules or students")
            return False
        
        schedule_id = self.created_entities['schedules'][0]
        
        # Get schedule attendance (enrolled students)
        success, response = self.make_request('GET', f'attendance/schedule/{schedule_id}')
        if success and isinstance(response, list):
            self.log_test("Get schedule attendance", True)
            
            # Record attendance for students
            if response:
                attendance_records = []
                for i, student_record in enumerate(response):
                    attendance_records.append({
                        "student_id": student_record["student_id"],
                        "present": i % 2 == 0,  # Alternate present/absent
                        "notes": f"Test attendance record {i+1}"
                    })
                
                success, response = self.make_request('POST', f'attendance/schedule/{schedule_id}', data=attendance_records, expected_status=200)
                if success:
                    self.log_test("Record attendance", True)
                else:
                    self.log_test("Record attendance", False, str(response))
            else:
                self.log_test("Record attendance", False, "No enrolled students found")
        else:
            self.log_test("Get schedule attendance", False, str(response))

        return True

    def test_billing(self) -> bool:
        """Test Billing Management"""
        print("\n💰 Testing Billing...")
        
        if not self.created_entities['students']:
            print("❌ Cannot test billing - missing students")
            return False
        
        # Create billing for student
        student_id = self.created_entities['students'][0]
        future_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        
        billing_data = {
            "student_id": student_id,
            "amount": 150.00,
            "due_date": future_date,
            "description": "Mensualidad Yoga Matutino"
        }
        
        success, response = self.make_request('POST', 'billing', data=billing_data, expected_status=200)
        if success and 'id' in response:
            bill_id = response['id']
            self.created_entities['billing'].append(bill_id)
            self.log_test("Create billing for student", True)
        else:
            self.log_test("Create billing for student", False, str(response))
            return False

        # List billing
        success, response = self.make_request('GET', 'billing')
        if success and isinstance(response, list):
            self.log_test("List billing", True)
        else:
            self.log_test("List billing", False, str(response))

        # Get billing detail
        success, response = self.make_request('GET', f'billing/{bill_id}')
        if success and 'id' in response:
            self.log_test("Get billing detail", True)
        else:
            self.log_test("Get billing detail", False, str(response))

        return True

    def test_upcoming_classes(self) -> bool:
        """Test Upcoming Classes endpoint"""
        print("\n⏰ Testing Upcoming Classes...")
        
        success, response = self.make_request('GET', 'classes/upcoming')
        if success and isinstance(response, list):
            self.log_test("Get upcoming classes", True)
        else:
            self.log_test("Get upcoming classes", False, str(response))

        return True

    def run_all_tests(self) -> bool:
        """Run all backend tests"""
        print("🚀 Starting Backend API Tests for Sistema de Gestión de Clases")
        print(f"Base URL: {self.base_url}")
        print("=" * 60)

        # Authentication is required for all endpoints
        if not self.test_login():
            print("❌ Authentication failed - stopping tests")
            return False

        # Test all CRUD operations
        test_methods = [
            self.test_dashboard,
            self.test_teachers_crud,
            self.test_class_types_crud,
            self.test_classrooms_crud,
            self.test_classes_crud,
            self.test_students_crud,
            self.test_schedules,
            self.test_enrollment,
            self.test_attendance,
            self.test_billing,
            self.test_upcoming_classes
        ]

        for test_method in test_methods:
            try:
                test_method()
            except Exception as e:
                print(f"❌ {test_method.__name__} failed with exception: {str(e)}")

        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All backend tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    """Main test runner"""
    tester = ClassManagementTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())