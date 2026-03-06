const axios = require("axios");

const EMPLOYEE_API = "https://dummy.restapiexample.com/api/v1/employees";

// Replace 
const CLIENT_ID = "";
const CLIENT_SECRET = "";

const ORG_NAME = "";
const TENANT_NAME = "";

const TOKEN_URL = "https://cloud.uipath.com/identity_/connect/token";

// Queue API URL
const ORCHESTRATOR_URL =
`https://cloud.uipath.com/${ORG_NAME}/${TENANT_NAME}/orchestrator_/odata/Queues/UiPathODataSvc.AddQueueItem`;


// STEP 1 — Generate Access Token
async function getAccessToken() {

    try {

        const params = new URLSearchParams();

        params.append("grant_type", "client_credentials");
        params.append("client_id", CLIENT_ID);
        params.append("client_secret", CLIENT_SECRET);
        params.append("scope", "OR.Queues.Write");

        const response = await axios.post(
            TOKEN_URL,
            params,
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }
        );

        return response.data.access_token;

    } catch (error) {

        console.log("Token Error:", error.response?.data || error.message);
        throw error;
    }
}


// STEP 2 — Add Item to UiPath Queue
async function addToQueue(employee, priority, token) {

    try {

        const payload = {
            itemData: {
                Name: "New Hires",
                Priority: priority,
                SpecificContent: {
                    EmployeeID: employee.id,
                    EmployeeName: employee.employee_name,
                    Salary: employee.employee_salary,
                    Age: employee.employee_age
                }
            }
        };

        const response = await axios.post(
            ORCHESTRATOR_URL,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    "X-UIPATH-OrganizationUnitId": "7602584"   // Folder ID
                }
            }
        );

        console.log("Added to Queue:", employee.employee_name);

    } catch (error) {

        console.log(
            "Queue Error:",
            error.response?.data || error.message
        );

    }
}


// STEP 3 — Fetch Employees and Process
async function processEmployees() {

    try {

        // Generate Access Token
        const token = await getAccessToken();
        console.log("Access Token Generated");

        // Fetch Employee Data
        const response = await axios.get(EMPLOYEE_API);
        const employees = response.data.data;

        for (const emp of employees) {

            const salary = parseInt(emp.employee_salary);

            let priority = "Low";

            if (salary > 300000) {
                priority = "High";
            }
            else if (salary >= 100000 && salary <= 300000) {
                priority = "Normal";
            }

            await addToQueue(emp, priority, token);

        }

        console.log("All employees added to queue");

    }
    catch (error) {

        console.log("Process Error:", error.message);

    }
}


// Run Program
//processEmployees();
exports.handler = async (event) => {

    await processEmployees();

    return {
        statusCode: 200,
        body: "Employees processed and added to UiPath Queue"
    };

};