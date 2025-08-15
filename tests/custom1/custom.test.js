
import conversion from '../../src/lib/arloconversion';

// Your full (or as complete as possible) case statement string
const awsCaseStatement = `
when(
    ("AWS_SERVICE" = "Elastic Load Balancing" AND contains("USAGE_TYPE","LoadBalancerUsage")), "EC2 - Load Balancer"),
when(
    ("AWS_SERVICE" = "Amazon API Gateway"), "Amazon API Gateway"),
when(
    ("AWS_SERVICE" = "Amazon Athena"), "Amazon Athena"),
when(
    ("AWS_SERVICE" = "Amazon EC2 Container Registry (ECR)"), "Amazon EC2 Container Registry (ECR)"),
when(
    ("AWS_SERVICE" = "Amazon Elastic Container Service"), "Amazon Elastic Container Service"),
when(
    ("AWS_SERVICE" = "Amazon Elastic Container Service for Kubernetes"), "Elastic Container Service for Kubernetes (EKS)"),
when(
    ("AWS_SERVICE" = "Amazon Elastic File System"), "Amazon Elastic File System"),
when(
    ("AWS_SERVICE" = "Amazon Elastic MapReduce"), "Amazon Elastic MapReduce"),
when(
    ("AWS_SERVICE" = "Amazon ElastiCache"), "ElastiCache - Compute"),
when(
    ("AWS_SERVICE" = "Amazon Glacier"), "S3 - Glacier"),
when(
    ("AWS_SERVICE" = "Amazon GuardDuty"), "Amazon GuardDuty"),
when(
    ("AWS_SERVICE" = "Amazon Kinesis"), "Amazon Kinesis"),
when(
    ("AWS_SERVICE" = "Amazon Kinesis Analytics"), "Kinesis Analytics - KPU Hour"),
when(
    ("AWS_SERVICE" = "Amazon Kinesis Firehose"), "Amazon Kinesis Firehose"),
when(
    ("AWS_SERVICE" = "Amazon Location Service"), "Amazon Location Service"),
when(
    ("AWS_SERVICE" = "Amazon Managed Grafana"), "Amazon Managed Grafana"),
when(
    ("AWS_SERVICE" = "Amazon OpenSearch Service"), "Amazon OpenSearch Service"),
when(
    ("AWS_SERVICE" = "Amazon Pinpoint"), "Pinpoint - Messages Sent"),
when(
    ("AWS_SERVICE" = "Amazon QuickSight"), "Amazon QuickSight"),
when(
    ("AWS_SERVICE" = "Amazon Redshift"), "Amazon Redshift"),
when(
    ("AWS_SERVICE" = "Amazon S3 Glacier Deep Archive"), "S3 - Glacier"),
when(
    ("AWS_SERVICE" = "Amazon Simple Email Service"), "Amazon Simple Email Service"),
when(
    ("AWS_SERVICE" = "Amazon Simple Notification Service"), "Amazon Simple Notification Service"),
when(
    ("AWS_SERVICE" = "Amazon Simple Queue Service"), "Amazon Simple Queue Service"),
when(
    ("AWS_SERVICE" = "Amazon SimpleDB"), "Amazon SimpleDB"),
when(
    ("AWS_SERVICE" = "Amazon Timestream"), "Timestream"),
when(
    ("AWS_SERVICE" = "AWS Amplify"), "AWS Amplify"),
when(
    ("AWS_SERVICE" = "AWS AppSync"), "AWS AppSync"),
when(
    ("AWS_SERVICE" = "AWS Backup"), "AWS Backup"),
when(
    ("AWS_SERVICE" = "AWS Certificate Manager"), "Certificate Manager - Certificate Authority"),
when(
    ("AWS_SERVICE" = "AWS CloudHSM"), "AWS CloudHSM"),
when(
    ("AWS_SERVICE" = "AWS CloudShell"), "AWS CloudShell"),
when(
    ("AWS_SERVICE" = "AWS CloudTrail"), "AWS CloudTrail"),
when(
    ("AWS_SERVICE" = "AWS Config"), "AWS Config"),
when(
    ("AWS_SERVICE" = "AWS Cost Explorer"), "AWS Cost Explorer"),
when(
    ("AWS_SERVICE" = "AWS Data Pipeline"), "AWS Data Pipeline"),
when(
    ("AWS_SERVICE" = "AWS Data Transfer"), "EC2 - Transfer"),
when(
    ("AWS_SERVICE" = "AWS DataSync"), "AWS DataSync"),
when(
    ("AWS_SERVICE" = "AWS Database Migration Service"), "AWS Database Migration Service"),
when(
    ("AWS_SERVICE" = "AWS Application Migration Service"), "AWS Application Migration Service"),
when(
    ("AWS_SERVICE" = "AWS Direct Connect"), "AWS Direct Connect"),
when(
    ("AWS_SERVICE" = "AWS Directory Service"), "AWS Directory Service"),
when(
    ("AWS_SERVICE" = "AWS Global Accelerator"), "Global Accelerator - Fixed Fee"),
when(
    ("AWS_SERVICE" = "AWS Glue"), "AWS Glue"),
when(
    ("AWS_SERVICE" = "AWS IoT"), "AWS IoT"),
when(
    ("AWS_SERVICE" = "AWS Key Management Service"), "AWS Key Management Service"),
when(
    ("AWS_SERVICE" = "AWS Premium Support"), "AWS Premium Support"),
when(
    ("AWS_SERVICE" = "AWS Support (Enterprise)"), "AWS Premium Support"),
when(
    ("AWS_SERVICE" = "AWS Security Hub"), "AWS Security Hub"),
when(
    ("AWS_SERVICE" = "AWS Service Catalog"), "AWS Service Catalog"),
when(
    ("AWS_SERVICE" = "AWS Step Functions"), "AWS Step Functions"),
when(
    ("AWS_SERVICE" = "AWS Systems Manager"), "AWS Systems Manager"),
when(
    ("AWS_SERVICE" = "AWS Transfer Family"), "Transfer Family - Other"),
when(
    ("AWS_SERVICE" = "AWS WAF"), "AWS WAF"),
when(
    ("AWS_SERVICE" = "AWS X-Ray"), "AWS X-Ray"),
when(
    ("AWS_SERVICE" = "CloudFront Security Bundle"), "CloudFront Security Bundle"),
when(
    ("AWS_SERVICE" = "CloudWatch Events"), "AmazonCloudWatch"),
when(
    ("AWS_SERVICE" = "DynamoDB Accelerator (DAX)"), "DynamoDB Accelerator - Node Hours"),
when(
    ("AWS_SERVICE" = "EDP Discount"), "EDP Discount"),
when(
    ("AWS_SERVICE" = "Private Rate Card Discount"), "Private Rate Card Discount"),
when(
    ("AWS_SERVICE" = "Savings Plans for AWS Compute usage"), "Savings Plans for AWS Compute usage"),
when(
    ("AWS_SERVICE" = "CSPP Private Offer"), "CSPP Private Offer"),
when(
    ("AWS_SERVICE" = "Databricks Unified Analytics Platform - Annual Commitment v3"), "Databricks Unified Analytics Platform - Annual Commitment v3"),
when(
    ("AWS_SERVICE" = "CentOS 8.2 Minimal CHI/Linux - SL1"), "Amazon Marketplace"),
when(
    ("AWS_SERVICE" = "CIS Amazon Linux 2 Benchmark - Level 2"), "Amazon Marketplace"),
when(
    ("AWS_SERVICE" = "Debian 10 (Debian Buster) with Support by Supported Images"), "Amazon Marketplace"),
when(
    ("AWS_SERVICE" = "Genymotion Cloud : Android 10.0 (Q)"), "Amazon Marketplace"),
when(
    ("AWS_SERVICE" = "Genymotion Cloud - Android 10.0 (x86_64)"), "Amazon Marketplace"),
when(
    ("AWS_SERVICE" = "Wowza Streaming Engine (Linux PAID)"), "Amazon Marketplace"),
when(
    ("AWS_SERVICE" = "CIS Amazon Linux 2 Kernel 4.14 Benchmark - Level 1"), "Amazon Marketplace"),
when(
    ("AWS_SERVICE" = "VM-Series Virtual NextGen Firewall w/ Threat Prevention - Bundle1 AWS"), "Amazon Marketplace"),
when(
    ("AWS_SERVICE" = "Oracle Linux Server 8.6 with support by Tiov IT"), "Amazon Marketplace"),
when(
    ("AWS_SERVICE" = "Oracle Linux Server 8.7 with support by Tiov IT"), "Amazon Marketplace"),
when(
    ("AWS_SERVICE" = "Debian 10 with Support by Supported Images"), "Amazon Marketplace"),
when(
    ("AWS_SERVICE" = "NGINX Plus Premium - Amazon Linux 2 (LTS) AMI"), "NGINX Plus Premium - Amazon Linux 2 (LTS) AMI"),
when(
    ("AWS_SERVICE" = "Amazon Inspector"), "Amazon Inspector"),
when(
    ("AWS_SERVICE" = "Splunk Private Offer Session 3"), "Splunk Private Offer Session 3"),
when(
    ("AWS_SERVICE" = "Splunk Private Offer Session 1"), "Splunk Private Offer Session 1"),
when(
    ("AWS_SERVICE" = "Splunk Private Offer Session 4"), "Splunk Private Offer Session 4"),
when(
    ("AWS_SERVICE" = "Splunk Private Offer Session 5"), "Splunk Private Offer Session 5"),
when(
    ("AWS_SERVICE" = "Rafay Kubernetes Operations Platform"), "Rafay Kubernetes Operations Platform"),
when(
    ("AWS_SERVICE" = "Anaplan"), "Anaplan"),
when(
    ("AWS_SERVICE" = "Continuous Delivery-as-a-Service platform"), "Continuous Delivery-as-a-Service platform"),
when(
    ("AWS_SERVICE" = "AWS Certification Pathway Package"), "AWS Certification Pathway Package"),
when(
    ("AWS_SERVICE" = "AWS CodePipeline"), "AWS CodePipeline"),
when(
    ("AWS_SERVICE" = "Amazon Rekognition"), "Amazon Rekognition"),
when(
    ("AWS_SERVICE" = "Amazon CloudFront" AND contains("USAGE_TYPE","Requests-")), "CloudFront - HTTPS Requests"),
when(
    ("AWS_SERVICE" = "Amazon CloudFront" AND contains("USAGE_TYPE","Lambda-")), "CloudFront - Lambda Edge Compute"),
when(
    ("AWS_SERVICE" = "Amazon CloudFront" AND contains("USAGE_TYPE","Invalidations")), "CloudFront - Other"),
when(
    ("AWS_SERVICE" = "Amazon CloudFront" AND contains("USAGE_TYPE","SSL-Cert-Custom")), "CloudFront - SSL Certificate"),
when(
    ("AWS_SERVICE" = "Amazon CloudFront" AND contains("USAGE_TYPE","DataTransfer-")), "CloudFront - Transfer"),
when(
    ("AWS_SERVICE" = "Amazon DynamoDB" AND contains("USAGE_TYPE","TimedBackupStorage-")), "DynamoDB - Backup"),
when(
    ("AWS_SERVICE" = "Amazon DynamoDB" AND contains("USAGE_TYPE","TimedPITRStorage-")), "DynamoDB - Backup"),
when(
    ("AWS_SERVICE" = "Amazon DynamoDB" AND contains("USAGE_TYPE","ExportDataSize-")), "DynamoDB - Backup"),
when(
    ("AWS_SERVICE" = "Amazon DynamoDB" AND contains("USAGE_TYPE","DataTransfer-In")), "DynamoDB - Data Transfer In"),
when(
    ("AWS_SERVICE" = "Amazon DynamoDB" AND contains("USAGE_TYPE","DataTransfer-Out")), "DynamoDB - Data Transfer In"),
when(
    ("AWS_SERVICE" = "Amazon DynamoDB" AND contains("USAGE_TYPE","ReadCapacityUnit-")), "DynamoDB - Provisioned Read Capacity"),
when(
    ("AWS_SERVICE" = "Amazon DynamoDB" AND contains("USAGE_TYPE","ReadRequestUnits")), "DynamoDB - Provisioned Read Capacity"),
when(
    ("AWS_SERVICE" = "Amazon DynamoDB" AND contains("USAGE_TYPE",":dynamodb.read")), "DynamoDB - Provisioned Read Capacity"),
when(
    ("AWS_SERVICE" = "Amazon DynamoDB" AND contains("USAGE_TYPE","WriteCapacityUnit-")), "DynamoDB - Provisioned Write Capacity"),
when(
    ("AWS_SERVICE" = "Amazon DynamoDB" AND contains("USAGE_TYPE","WriteRequestUnits")), "DynamoDB - Provisioned Write Capacity"),
when(
    ("AWS_SERVICE" = "Amazon DynamoDB" AND contains("USAGE_TYPE","dynamodb.write")), "DynamoDB - Provisioned Write Capacity"),
when(
    ("AWS_SERVICE" = "Amazon DynamoDB" AND contains("USAGE_TYPE","TimedStorage-")), "DynamoDB - Storage"),
when(
    ("AWS_SERVICE" = "Amazon DynamoDB" AND contains("USAGE_TYPE","ChangeDataCaptureUnits-")), "DynamoDB - Storage"),
when(
    ("AWS_SERVICE" = "Amazon Elastic Compute Cloud" AND contains("USAGE_TYPE","VolumeIOUsage")), "EBS - I/O"),
when(
    ("AWS_SERVICE" = "Amazon Elastic Compute Cloud" AND contains("USAGE_TYPE","VolumeP-IOPS")), "EBS - PIOPs Storage"),
when(
    ("AWS_SERVICE" = "Amazon Elastic Compute Cloud" AND contains("USAGE_TYPE","VolumeP-Throughput")), "EBS - PIOPs Storage"),
when(
    ("AWS_SERVICE" = "Amazon Elastic Compute Cloud" AND contains("USAGE_TYPE","EBS:VolumeUsage")), "EBS - Storage"),
when(
    ("AWS_SERVICE" = "Amazon Elastic Compute Cloud" AND contains("USAGE_TYPE","BoxUsage")), "EC2 - Compute"),
when(
    ("AWS_SERVICE" = "Amazon Elastic Compute Cloud" AND contains("USAGE_TYPE","SpotUsage")), "EC2 - Compute"),
when(
    ("AWS_SERVICE" = "Amazon Elastic Compute Cloud" AND contains("USAGE_TYPE","EBSOptimized")), "EC2 - Compute"),
when(
    ("AWS_SERVICE" = "Amazon Elastic Compute Cloud" AND contains("USAGE_TYPE","HeavyUsage")), "EC2 - Compute"),
when(
    ("AWS_SERVICE" = "Amazon Elastic Compute Cloud" AND contains("USAGE_TYPE","CPUCredits")), "EC2 - Compute"),
when(
    ("AWS_SERVICE" = "Amazon Elastic Compute Cloud" AND contains("USAGE_TYPE","HostBoxUsage")), "EC2 - Compute"),
when(
    ("AWS_SERVICE" = "Amazon Elastic Compute Cloud" AND contains("USAGE_TYPE","HostUsage")), "EC2 - Compute"),
when(
    ("AWS_SERVICE" = "Amazon Elastic Compute Cloud" AND contains("USAGE_TYPE","SnapshotUsage")), "EC2 - EBS Snapshot"),
when(
    ("AWS_SERVICE" = "Amazon Elastic Compute Cloud" AND contains("USAGE_TYPE","FastSnapshotRestore")), "EC2 - EBS Snapshot"),
when(
    ("AWS_SERVICE" = "Amazon Elastic Compute Cloud" AND contains("USAGE_TYPE","EBS:directAPI.snapshot")), "EC2 - EBS Snapshot"),
when(
    ("AWS_SERVICE" = "Amazon Elastic Compute Cloud" AND contains("USAGE_TYPE","ElasticIP")), "EC2 - Elastic IP"),
when(
    ("AWS_SERVICE" = "Amazon Elastic Compute Cloud" AND contains("USAGE_TYPE","NatGateway-Bytes")), "EC2 - NAT Gateway Transfer"),
when(
    ("AWS_SERVICE" = "Amazon Elastic Compute Cloud" AND contains("USAGE_TYPE","Requests")), "EC2 - Other API Request"),
when(
    ("AWS_SERVICE" = "Amazon Elastic Compute Cloud" AND contains("USAGE_TYPE","VPN-Connection")), "EC2 - VPN Connection"),
when(
    ("AWS_SERVICE" = "Elastic Load Balancing" AND contains("USAGE_TYPE","LoadBalancerUsage")), "EC2 - Load Balancer"),
when(
    ("AWS_SERVICE" = "Elastic Load Balancing" AND contains("USAGE_TYPE","requests")), "EC2 - Load Balancer"),
when(
    ("AWS_SERVICE" = "Elastic Load Balancing" AND contains("USAGE_TYPE","SSLPolicy")), "EC2 - Load Balancer"),
when(
    ("AWS_SERVICE" = "Elastic Load Balancing" AND contains("USAGE_TYPE","IP-Address")), "EC2 - Load Balancer"),
when(
    ("AWS_SERVICE" = "Elastic Load Balancing" AND contains("USAGE_TYPE","ELB-Byte")), "EC2 - Load Balancer"),
when(
    ("AWS_SERVICE" = "Elastic Load Balancing" AND contains("USAGE_TYPE","ELB-CLB")), "EC2 - Load Balancer"),
when(
    ("AWS_SERVICE" = "Elastic Load Balancing" AND contains("USAGE_TYPE","ELB-Lcu")), "EC2 - Load Balancer"),
when(
    ("AWS_SERVICE" = "AWS Elemental MediaConvert" AND contains("USAGE_TYPE","Video-")), "Elemental MediaConvert - Video"),
when(
    ("AWS_SERVICE" = "AWS Elemental MediaConvert" AND contains("USAGE_TYPE","Audio-")), "Elemental MediaConvert - Audio"),
when(
    ("AWS_SERVICE" = "Amazon EC2 Container Service for Kubernetes" AND contains("USAGE_TYPE","EC2-Container-Service-for-Kubernetes-hours")), "EKS - Compute"),
when(
    ("AWS_SERVICE" = "Amazon Elastic Kubernetes Service" AND contains("USAGE_TYPE","EKS-Hours")), "EKS - Compute"),
when(
    ("AWS_SERVICE" = "Amazon Elastic Transcoder" AND contains("USAGE_TYPE","minutes")), "Elastic Transcoder - Minutes"),
when(
    ("AWS_SERVICE" = "Amazon Elastic Transcoder" AND contains("USAGE_TYPE","Video-")), "Elastic Transcoder - Video"),
when(
    ("AWS_SERVICE" = "Amazon MQ" AND contains("USAGE_TYPE","Broker-Storage")), "MQ - Broker Storage"),
when(
    ("AWS_SERVICE" = "Amazon MQ" AND contains("USAGE_TYPE","Broker-Connections")), "MQ - Broker Connections"),
when(
    ("AWS_SERVICE" = "Amazon MQ" AND contains("USAGE_TYPE","Broker-Hours")), "MQ - Broker Hours"),
when(
    ("AWS_SERVICE" = "Amazon RDS" AND contains("USAGE_TYPE","RDS:ChargedBackupUsage")), "RDS - Backup Storage"),
when(
    ("AWS_SERVICE" = "Amazon RDS" AND contains("USAGE_TYPE","RDS:StorageUsage")), "RDS - Storage"),
when(
    ("AWS_SERVICE" = "Amazon RDS" AND contains("USAGE_TYPE","RDS:PIOPS")), "RDS - PIOPS"),
when(
    ("AWS_SERVICE" = "Amazon RDS" AND contains("USAGE_TYPE","DatabaseUsage")), "RDS - Database Instance"),
when(
    ("AWS_SERVICE" = "Amazon RDS" AND contains("USAGE_TYPE","DataTransfer-Out")), "RDS - Data Transfer"),
when(
    ("AWS_SERVICE" = "Amazon RDS" AND contains("USAGE_TYPE","DataTransfer-In")), "RDS - Data Transfer"),
when(
    ("AWS_SERVICE" = "Amazon Redshift" AND contains("USAGE_TYPE","TimedStorage-Backup")), "Redshift - Backup Storage"),
when(
    ("AWS_SERVICE" = "Amazon Redshift" AND contains("USAGE_TYPE","Node")), "Redshift - Node"),
when(
    ("AWS_SERVICE" = "Amazon Redshift" AND contains("USAGE_TYPE","Concurreny-Scaling-Hour")), "Redshift - Concurrency Scaling"),
when(
    ("AWS_SERVICE" = "Amazon Route 53" AND contains("USAGE_TYPE","DNSQueries")), "Route 53 - DNS Queries"),
when(
    ("AWS_SERVICE" = "Amazon Route 53" AND NOT contains("USAGE_TYPE","HostedZone")), "Amazon Route 53"),
when(
    ("AWS_SERVICE" = "Amazon Route 53" AND contains("USAGE_TYPE","HealthCheck")), "Route 53 - Health Check"),
when(
    ("AWS_SERVICE" = "Amazon Route 53" AND contains("USAGE_TYPE","HostedZone")), "Route 53 - Hosted Zone"),
when(
    ("AWS_SERVICE" = "Amazon S3" AND contains("USAGE_TYPE","Storage")), "S3 - Standard Storage"),
when(
    ("AWS_SERVICE" = "Amazon S3" AND contains("USAGE_TYPE","EarlyDelete")), "S3 - Early Delete"),
when(
    ("AWS_SERVICE" = "Amazon S3" AND contains("USAGE_TYPE","TimedStorage-RRS")), "S3 - Reduced Redundancy Storage"),
when(
    ("AWS_SERVICE" = "Amazon S3" AND contains("USAGE_TYPE","Requests-")), "S3 - Request"),
when(
    ("AWS_SERVICE" = "Amazon S3" AND contains("USAGE_TYPE","Retrieval")), "S3 - Retrieval"),
when(
    ("AWS_SERVICE" = "Amazon S3" AND contains("USAGE_TYPE","DataTransfer-In")), "S3 - Data Transfer"),
when(
    ("AWS_SERVICE" = "Amazon S3" AND contains("USAGE_TYPE","DataTransfer-Out")), "S3 - Data Transfer"),
when(
    ("AWS_SERVICE" = "Amazon S3" AND contains("USAGE_TYPE","Select-")), "S3 - Select"),
when(
    ("AWS_SERVICE" = "Amazon S3" AND contains("USAGE_TYPE","IntelligentTiering-")), "S3 - Intelligent Tiering"),
when(
    ("AWS_SERVICE" = "Amazon SageMaker" AND contains("USAGE_TYPE","Notebook-Instance-Hours")), "SageMaker - Notebook Instance Hours"),
when(
    ("AWS_SERVICE" = "Amazon SageMaker" AND contains("USAGE_TYPE","Training-Hours")), "SageMaker - Training Hours"),
when(
    ("AWS_SERVICE" = "Amazon SageMaker" AND contains("USAGE_TYPE","Inference-Hours")), "SageMaker - Inference Hours"),
when(
    ("AWS_SERVICE" = "Amazon SageMaker" AND contains("USAGE_TYPE","EFS-Storage")), "SageMaker - EFS Storage"),
when(
    ("AWS_SERVICE" = "Amazon SageMaker" AND contains("USAGE_TYPE","SageMaker-Processing-Job-Hours")), "SageMaker - Processing Job Hours"),
when(
    ("AWS_SERVICE" = "Amazon SageMaker" AND contains("USAGE_TYPE","DataTransfer-Out")), "SageMaker - Data Transfer"),
when(
    ("AWS_SERVICE" = "Amazon SageMaker" AND contains("USAGE_TYPE","Autopilot-Job-Hours")), "SageMaker - Autopilot Job Hours"),
when(
    ("AWS_SERVICE" = "Amazon SageMaker" AND contains("USAGE_TYPE","GroundTruth-")), "SageMaker - GroundTruth"),
when(
    ("AWS_SERVICE" = "Amazon SageMaker" AND contains("USAGE_TYPE","FeatureStore-")), "SageMaker - FeatureStore"),
when(
    ("AWS_SERVICE" = "AWS Secrets Manager" AND contains("USAGE_TYPE","SecretsManager-")), "Secrets Manager - Secret"),
when(
    ("AWS_SERVICE" = "Amazon SNS" AND contains("USAGE_TYPE","Requests-")), "SNS - Requests"),
when(
    ("AWS_SERVICE" = "Amazon SNS" AND contains("USAGE_TYPE","Delivery-")), "SNS - Delivery"),
when(
    ("AWS_SERVICE" = "Amazon SNS" AND contains("USAGE_TYPE","Publish-")), "SNS - Publish"),
when(
    ("AWS_SERVICE" = "AWS Config" AND contains("USAGE_TYPE","ConfigRuleEvaluation")), "AWS Config - Rule Evaluations"),
when(
    ("AWS_SERVICE" = "AWS Config" AND contains("USAGE_TYPE","ConfigItemRecording")), "AWS Config - Configuration Items"),
when(
    ("AWS_SERVICE" = "AWS CloudTrail" AND contains("USAGE_TYPE","ApiCalls")), "CloudTrail - API Calls"),
when(
    ("AWS_SERVICE" = "AmazonCloudWatch" AND contains("USAGE_TYPE","MetricStorage")), "CloudWatch - Metric Storage"),
when(
    ("AWS_SERVICE" = "AmazonCloudWatch" AND contains("USAGE_TYPE","Dashboard")), "CloudWatch - Dashboard"),
when(
    ("AWS_SERVICE" = "AmazonCloudWatch" AND contains("USAGE_TYPE","Alarm")), "CloudWatch - Alarm"),
when(
    ("AWS_SERVICE" = "AmazonCloudWatch" AND contains("USAGE_TYPE","Requests")), "CloudWatch - API Requests"),
when(
    ("AWS_SERVICE" = "AmazonCloudWatch" AND contains("USAGE_TYPE","Logs-Bytes")), "CloudWatch - Logs Ingestion"),
when(
    ("AWS_SERVICE" = "AmazonCloudWatch" AND contains("USAGE_TYPE","CW:GMD-Custom")), "CloudWatch - Custom Metrics"),
when(
    ("AWS_SERVICE" = "Amazon Elastic Container Service for Kubernetes" AND contains("USAGE_TYPE","EC2-Container-Service-for-Kubernetes-hours")), "EKS - Compute"),
when(
    ("AWS_SERVICE" = "AWS Lambda" AND contains("USAGE_TYPE","Lambda-GB")), "Lambda - Compute"),
when(
    ("AWS_SERVICE" = "AWS Lambda" AND contains("USAGE_TYPE","Lambda-Request")), "Lambda - Request")
;
`;


describe('custom.test.js', () => {
  it.only('convert word to CC', async () => {
    const output = conversion.convert(awsCaseStatement,'ccs','1001');
    const fs = require('fs');
    const outputFileName = 'output.json';
    fs.writeFileSync(outputFileName, JSON.stringify(output, null, 2));
    console.log(`Wrote output to ${outputFileName}`);
  });
});