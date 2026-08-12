# Infrastructure (Terraform / CloudShell)

**Status:** Not implemented yet. This folder will hold flat Terraform for the AWS resources described in `docs/ARCHITECTURE.md`.

## Intended CloudShell workflow (when infra exists)

```bash
cd infra
terraform init
terraform plan  -var-file=environments/dev.tfvars
terraform apply -var-file=environments/dev.tfvars
```

Then from repo root (script TBD):

```bash
./scripts/deploy-web.sh   # build SPA → S3 → CloudFront invalidation
```

## Constraints

- Must be operable from AWS CloudShell.
- Prefer simple `.tf` files over deep module trees.
- No secrets in tfvars committed to git; use Secrets Manager / SSM.
