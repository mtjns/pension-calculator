# **API Documentation**

**Endpoint:** `GET /api/calculate`

This API calculates retirement scenarios based on the user's input, returning a list of possible options (e.g., immediate retirement, early retirement, or deferred retirement).

## **1\. Request Parameters**

| Parameter       | Type   | Required        | Description                                                |
| :-------------- | :----- | :-------------- | :--------------------------------------------------------- |
| salary          | number | **Yes**         | Gross monthly salary in CZK.                               |
| years           | number | **Yes**         | Total years of insurance (worked + substitute).            |
| birthYear       | number | **Yes**         | Year of birth (e.g., 1965).                                |
| gender          | string | No, default 'M' | 'M' (Male) or 'F' (Female).                                |
| children        | number | No, default 0   | Number of raised children (affects women's pension age).   |
| substituteYears | number | No, default 0   | Substitute periods (study, military).                       |

## **2\. Response Format**

The API returns a JSON object containing an array of scenarios.

### **Success Response (200 OK)**
```
{  
  "scenarios": [  
    {  
      "id": "now_pension",  
      "title": "Řádný odchod do důchodu (Teď)",  
      "amount": 24500,  
      "desc": "Okamžitý odchod. Máte splněn věk i dobu pojištění.",  
      "type": "neutral"  
    }
  ]  
}
```
### **Error Response (400 Bad Request)**
```
{  
  "error": "Neplatný ročník narození. Zadejte rok mezi 1920 a 2010."  
}
```
## **3\. Scenarios & IDs**

The API logic branches into two main paths based on whether the user has reached their retirement age.

### **A: User has reached retirement age**

*(User is old enough to retire immediately)*

| ID               | Title                       | Description                 | Type    |
| :--------------- | :-------------------------- | :-------------------------- | :------ |
| now_pension      | **Immediate Pension**       | Stop working, take pension. | neutral |
| now_work_pension | **Concurrent (Souběh)**     | Work and receive pension.   | best    |
| now_defer        | **Deferral (Přesluhování)** | Work without pension.       | neutral |

### **B: User has NOT reached retirement age**

*(User is younger than retirement age)*

| ID               | Title               | Description                                    | Type    |
| :--------------- | :------------------ | :--------------------------------------------- | :------ |
| early_pension    | **Early Pension**   | User is eligable for early retirement          | warn    |
| early_impossible | **Early (Blocked)** | User is too young for early retirement.        | neutral |
| future_defer     | **Future Deferral** | Plan to work extra years in the future.        | neutral |
| future_pension   | **Regular Future**  | The target pension at standard retirement age. | best    |

## **4\. Field Reference**

### **type**

Used by the frontend to style the result cards.

* **best**: Recommended option.  
* **warn**: Use caution, e.g., penalties. 
* **neutral**: Standard information.

### **amount**

* Returns a **whole number** (integer).  
* If 0, it indicates the scenario is currently impossible (e.g., early\_impossible).