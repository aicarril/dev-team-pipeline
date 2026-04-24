# AWS Best Practices

When implementing any AWS resource, consult the AWS documentation MCP server for current best practices before writing code.

Use it to:
- Verify correct resource configurations (e.g., S3 bucket policies, IAM roles)
- Check for required companion resources (e.g., S3 needs bucket policy + public access block for CloudFront OAC)
- Confirm correct ARN formats
- Look up current runtime versions (e.g., nodejs20.x for Lambda)
- Verify terraform resource attribute names and required fields

Do not guess. Look it up.
