# CostBucketAnalyzer - Local Installation Instructions

1. **Clone the repository:**
    ```
    git clone https://github.com/richpaul1/CostBucketAnalyzer.git
    cd CostBucketAnalyzer
    ```
2. **Install dependencies:**
    ```
    npm install
    ```

4. **Run the application:**
    ```
    npm run dev
    ```

5. **Load up the application:**
    ```
    Goto to http://localhost:5000
    ```

6. **Upload Your Cost Categories:**
    - Navigate to the Cost Categories screen in Harness
    - Look for the network call for businessmappings
    - Download the response json into a file
    - Upload the json into the analyzer
    ```
7. **Results**
    - The Table shows which Categories and Buckets have overlapping rules.
    - By Default we only analyze buckets within a category
    - There are overlap and duplicate Types.
    - Overlap rule is where the rule is defined in two buckets
    - Duplicate rule is where the rule exist wihin the same buck twice
    ```

