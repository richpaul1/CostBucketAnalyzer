# OIT-CME-CLOUDWATCH Cost Bucket Analysis

## 📋 **Basic Information**
- **Cost Bucket Name**: OIT-CME-CLOUDWATCH
- **UUID**: d312aefb-58e0-45a2-b2da-18a656148f72
- **Margin Percentage**: null (no margin applied)
- **Total Rules**: 3

## 🔍 **Rule Analysis**

### **Rule 1: Kubernetes Label-Based (user_cost_center + user_project_1)**
**Logic**: AND condition between two label conditions
- **Condition 1**: 
  - Field: `user_cost_center` (Label)
  - Operator: IN
  - Values: `["OIT"]`
- **Condition 2**: 
  - Field: `user_project_1` (Label)
  - Operator: IN
  - Values: `["cme-cloudwatch"]`

**Purpose**: Captures Kubernetes workloads where:
- Cost center is labeled as "OIT" 
- Project is labeled as "cme-cloudwatch"

### **Rule 2: Kubernetes Label-Based (Encoded URLs)**
**Logic**: AND condition between two encoded URL label conditions
- **Condition 1**: 
  - Field: `https://url.us.m.mimecastprotect.com/s/bHgaCxkxR1hrY8JQhwsksy6opY?domain=k8s.cbp.dhs.gov` (Label)
  - Operator: IN
  - Values: `["OIT"]`
- **Condition 2**: 
  - Field: `https://url.us.m.mimecastprotect.com/s/KQTkCyPyVXS9xDNySNtQsxyYoc?domain=k8s.cbp.dhs.gov` (Label)
  - Operator: IN
  - Values: `["cme-cloudwatch"]`

**Purpose**: Captures Kubernetes workloads using encoded URL-based labels (likely for security/obfuscation)
- Same logical structure as Rule 1 but with encoded field names
- Points to `k8s.cbp.dhs.gov` domain (DHS Kubernetes cluster)

### **Rule 3: AWS CloudWatch Services**
**Logic**: AND condition between AWS account and service
- **Condition 1**: 
  - Field: `awsUsageaccountid` (AWS)
  - Operator: IN
  - Values: `["173023000554"]`
- **Condition 2**: 
  - Field: `Service` (AWS)
  - Operator: IN
  - Values: `["AmazonCloudWatch"]`

**Purpose**: Captures all AWS CloudWatch costs from specific AWS account
- AWS Account ID: 173023000554
- Service: AmazonCloudWatch

## 📊 **Rule Summary**

| Rule # | Platform | Logic | Primary Filter | Secondary Filter |
|--------|----------|-------|----------------|------------------|
| 1 | Kubernetes | AND | user_cost_center = "OIT" | user_project_1 = "cme-cloudwatch" |
| 2 | Kubernetes | AND | Encoded cost_center = "OIT" | Encoded project = "cme-cloudwatch" |
| 3 | AWS | AND | Account = "173023000554" | Service = "AmazonCloudWatch" |

## 🎯 **Cost Allocation Strategy**

This cost bucket implements a **multi-platform cost allocation** strategy:

### **Kubernetes Costs (Rules 1 & 2)**
- Captures costs from DHS Kubernetes clusters (`k8s.cbp.dhs.gov`)
- Uses both standard and encoded label formats (possibly for security)
- Filters for OIT organization and cme-cloudwatch project
- Redundant rules ensure capture regardless of label encoding method

### **AWS Costs (Rule 3)**
- Captures all CloudWatch service costs from AWS account 173023000554
- Includes CloudWatch logs, metrics, alarms, dashboards, etc.
- Direct service-level allocation (no resource-level filtering)

## ⚠️ **Potential Issues & Observations**

### **1. Rule Redundancy**
- Rules 1 and 2 are functionally identical but use different label field names
- This suggests either:
  - Migration from one labeling system to another
  - Security obfuscation of label names
  - Backup rule in case one labeling method fails

### **2. Broad AWS Allocation**
- Rule 3 captures ALL CloudWatch costs from the AWS account
- No resource-level filtering (tags, resource names, etc.)
- Could include CloudWatch costs not related to the cme-cloudwatch project

### **3. Cross-Platform Coordination**
- Assumes coordination between Kubernetes and AWS CloudWatch usage
- CloudWatch likely monitors the Kubernetes infrastructure
- Cost bucket aggregates both the monitoring service (AWS) and monitored workloads (K8s)

## 🔧 **Optimization Recommendations**

### **1. Consolidate Redundant Rules**
- Determine which label format is current/preferred
- Remove or update obsolete rule
- Add comments explaining the dual-rule strategy if intentional

### **2. Refine AWS Rule**
- Add resource-level filtering using AWS tags
- Filter CloudWatch costs by resource tags matching the project
- Example: Add condition for `aws:ResourceTag/Project = "cme-cloudwatch"`

### **3. Performance Considerations**
- Rules 1 & 2: Label-based filtering is generally efficient
- Rule 3: Account + Service filtering is efficient
- Overall complexity: LOW (simple IN operators, no LIKE patterns)

## 📈 **Expected Cost Components**

This cost bucket should capture:
- **Kubernetes**: Pod/container costs for cme-cloudwatch project in OIT
- **AWS CloudWatch**: Logs, metrics, alarms, dashboards from account 173023000554
- **Monitoring Stack**: Complete monitoring infrastructure costs (both monitored and monitoring)
