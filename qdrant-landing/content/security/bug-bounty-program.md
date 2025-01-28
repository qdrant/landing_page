---
title: Bug Bounty Program
---

# Bug Bounty Program Overview
User trust is our top priority, and we adhere to the highest privacy and security standards. We actively invite security researchers to identify vulnerabilities and are committed to collaborating with them to resolve issues quickly and effectively.
Qdrant values the security research community and supports responsible disclosure of vulnerabilities in our products and services. Through our bug bounty program, we reward researchers who help us enhance the security of our platform.

## Responsible Dislcosure Program Rules
- Reports must include detailed, reproducible steps. Issues that cannot be reproduced will not qualify for a reward.
- Submit one vulnerability per report unless multiple vulnerabilities need to be chained to demonstrate impact.
- In cases of duplicate reports, only the first reproducible report received will be eligible for a reward.
- Vulnerabilities stemming from the same root cause will be considered a single issue and awarded one bounty.
- Social engineering attacks (e.g., phishing, vishing, smishing) are strictly prohibited.
- Only interact with accounts you own or have explicit permission to access. Do not test using Qdrant employee accounts or internal tools.
- Before running automated scanners, you will check with us first.

### In Scope
This program covers vulnerabilities found in the following areas:
- *.cloud.qdrant.io Qdrant Cloud Application
- [qdrant.tech](http://qdrant.tech) Website

### Out of Scope
The following areas are always out of scope:
- Third-party applications or websites
- Staging or test environments
- Social engineering attacks
- DOS/DDOS attacks
- User / email enumeration
- Brute forcing
- Physical security issues
- Reports from automated tools or scanners
- Generic information disclosure, such as the `Server` or `X-Powered-By` headers
- Email security: DMARC, DKIM, SPF
- Spamming that can be prevented by rate limiting techniques

## Severity Levels and Rewards (internal only)
- We assess reported bugs based on their risk and other relevant factors, so our response may take some time.
- Submissions that include detailed remediation steps or recommendations are more likely to receive higher rewards.
- Bounty amounts are determined by multiple factors, including the impact of the vulnerability, the ease of exploitation, and the quality of the report. Please note that very low-risk issues may not qualify for a bounty.
- We typically evaluate the criticality of issues using the CVSS v4 framework to ensure consistent risk assessment.
- While we aim to reward similar vulnerabilities with comparable compensation, factors such as the time and effort required to discover the issue are also considered. Keep in mind that rewards for future reports are not guaranteed to match past compensations.

## Disclosure Policy
Please contact us at [security@qdrant.com](mailto:security@qdrant.com) to report vulnerabilities. Our security team aims to provide an initial response within 5 business days, followed by triage within 5-7 business days. Fix implementation timelines vary based on severity, and bounty payments are processed after fix verification.

When disclosing vulnerabilities to us, we kindly ask you to adhere to the following guidelines:
- Report any potential security vulnerabilities immediately upon discovery - we are committed to swift resolution of all issues.
- Maintain strict confidentiality about discovered vulnerabilities. Public disclosure requires explicit authorization from the Qdrant security team.
- Exercise caution to prevent data loss, privacy breaches, or service disruptions while conducting security research.
- Limit testing to your own accounts or those where you have received explicit permission. Report any accidental access to unauthorized data immediately.
- Safe Harbor: We support ethical security research and commit to not initiating legal action against researchers who report vulnerabilities in good faith and comply with this disclosure policy. Ensure that your testing is non-disruptive and respects the outlined guidelines to qualify for Safe Harbor protections.

### Contact
For questions about the program or to report security issues, contact:
- Email: [security@qdrant.com](mailto:security@qdrant.com)
- PGP Key Fingerprint: [07E3 6646 E0D0 A3BF 0AFC B302 26C5 016B 97EB 804B](/misc/qdrant-security-public-key.asc)
