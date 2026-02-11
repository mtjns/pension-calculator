# **API Documentation**

**Endpoint:** `POST /api/calculate`

This API calculates retirement scenarios based on the user's input (including detailed career segments), returning a list of possible options (e.g., immediate retirement, early retirement, or deferred retirement).

## **1. Request Body (JSON)**

The API accepts a JSON object with the following structure:

| Field       | Type   | Required | Description                           |
| ----------- | ------ | -------- | ------------------------------------- |
| `birthDate` | string | **Yes**  | Date of birth in `YYYY-MM-DD` format. |
| `gender`    | string | **Yes**  | `'M'` (Male) or `'F'` (Female).       |
| `children`  | number | **Yes**  | Number of raised children.            |
| `segments`  | array  | **Yes**  | List of career segments (see below).  |

### **Segment Object Structure**

| Field       | Type   | Description                                           |
| ----------- | ------ | ----------------------------------------------------- |
| `type`      | string | `'work'`, `'study'`, or `'none'`.                     |
| `startDate` | string | Start date `YYYY-MM-DD`.                              |
| `endDate`   | string | End date `YYYY-MM-DD`.                                |
| `salary`    | number | Average monthly gross earnings for this period (CZK). |

## **2. Response Format**

The API returns a JSON object containing an array of scenarios.

### **Success Response (200 OK)**

```json
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

```json
{
  "error": "Chybí datum narození."
}
```

## **3. Scenarios & IDs**

The API logic branches into two main paths based on whether the user has reached their retirement age.

### **A: User has reached retirement age**

#### (User is old enough to retire immediately)

| ID                 | Title                       | Description                 | Type    |
| ------------------ | --------------------------- | --------------------------- | ------- |
| `now_pension`      | **Immediate Pension**       | Stop working, take pension. | neutral |
| `now_work_pension` | **Concurrent (Souběh)**     | Work and receive pension.   | best    |
| `now_defer`        | **Deferral (Přesluhování)** | Work without pension.       | neutral |

### **B: User has NOT reached retirement age**

#### (User is younger than retirement age)*

| ID                 | Title               | Description                                    | Type    |
| ------------------ | ------------------- | ---------------------------------------------- | ------- |
| `early_pension`    | **Early Pension**   | User is eligible for early retirement.         | warn    |
| `early_impossible` | **Early (Blocked)** | User is too young for early retirement.        | neutral |
| `future_defer`     | **Future Deferral** | Plan to work extra years in the future.        | neutral |
| `future_pension`   | **Regular Future**  | The target pension at standard retirement age. | best    |

## **4. Field Reference**

### **type**

Used by the frontend to style the result cards.

* **best**: Recommended option.

* **warn**: Use caution, e.g., penalties.

* **neutral**: Standard information.

### **amount**

* Returns a **whole number** (integer).

* If 0, it indicates the scenario is currently impossible (e.g., `early_impossible`).
