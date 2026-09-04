# CODE-A-NOVA HACKATHON

## Product Requirements Document (PRD)

**Product:** Code-A-Nova Hackathon Management System
**Platform:** Existing Code-A-Nova Website
**Primary Route:** `/hackathon`
**Document Type:** Product Requirements + Development Specification
**Version:** 1.0
**Status:** Development Ready

---

# 1. PRODUCT OVERVIEW

Code-A-Nova will host a fully online hackathon.

Initial registration and PPT submission will be conducted through **Unstop**.

After the Unstop registration/submission phase is complete, the complete registration data will be imported into the existing Code-A-Nova system through an Excel import function.

From that point onward, the complete hackathon lifecycle will be managed through the Code-A-Nova platform.

The system will have three primary user roles:

1. **Admin**
2. **Editorial / Judge**
3. **Participant / Team**

The platform must maintain a centralized database so that Admin, Editorial, and Participants see different information according to their permissions.

---

# 2. HIGH-LEVEL WORKFLOW

```text
UNSTOP
   │
   ├── Team Registration
   └── PPT / Idea Submission
          │
          ▼
ADMIN IMPORTS EXCEL
          │
          ▼
CODE-A-NOVA DATABASE
          │
          ▼
ADMIN REVIEWS TEAMS
          │
          ├── Reject
          │
          └── Shortlist
                  │
                  ▼
          AUTOMATIC EMAIL
                  │
                  ▼
          TEAM LEADER
                  │
                  ▼
          HACKATHON DASHBOARD
                  │
                  ▼
             ₹49 PAYMENT
                  │
                  ▼
             CONFIRMED
                  │
                  ▼
          WHATSAPP GROUP ACCESS
                  │
                  ▼
          HACKATHON DEVELOPMENT
                  │
                  ▼
          FINAL PROJECT SUBMISSION
                  │
                  ▼
          EDITORIAL JUDGING
                  │
                  ▼
          FINAL SCORE / RANKING
                  │
                  ▼
             RESULTS
                  │
                  ▼
          CERTIFICATE WITHIN 7 DAYS
```

---

# 3. IMPORTANT BUSINESS RULES

## 3.1 Unstop Registration

* Initial registration on Unstop is FREE.
* Teams register on Unstop.
* Teams submit their PPT/idea through Unstop.
* The Unstop data will later be exported as Excel.
* PPT information/file/link available in the Unstop export must be imported into Code-A-Nova.

## 3.2 Participation Confirmation Fee

* The initial Unstop registration is FREE.
* Only shortlisted teams must pay the mandatory **₹49 participation confirmation fee**.
* ₹49 is charged **per team**, NOT per member.
* Payment is required only after shortlisting.
* A team cannot become `CONFIRMED` until successful payment verification.
* Payment success must be verified server-side through the payment gateway webhook.
* Never mark a team confirmed only from frontend payment success.

## 3.3 Shortlisting

* Admin evaluates the submitted PPT and idea.
* Admin can shortlist or reject teams.
* Once Admin clicks `Shortlist`, the team's status immediately becomes `SHORTLISTED`.
* An automatic email must be sent to the team leader immediately after shortlisting.
* The email contains a link to the Code-A-Nova Hackathon dashboard/confirmation page.

## 3.4 Confirmation

After opening the link:

* Existing Code-A-Nova login session should be reused.
* User should NOT be forced to log in again if already authenticated.
* The system identifies the participant's team through the authenticated account.
* Shortlisted team sees the ₹49 confirmation option.
* Successful payment changes the team to `CONFIRMED`.
* Confirmed team gets access to the official WhatsApp group link.
* Hackathon dashboard becomes fully available.

---

# 4. URL / ROUTING

Use the existing Code-A-Nova website and normal routes.

Primary route:

`/hackathon`

Suggested routes:

```text
/hackathon
/hackathon/dashboard
/hackathon/submission
/hackathon/results
/hackathon/certificate

/hackathon/editorial/login
/hackathon/editorial
/hackathon/editorial/project/:id
```

The hackathon should remain part of the existing Code-A-Nova application.

Do NOT create a separate domain or separate application unless technically required later.

---

# 5. USER ROLES

## 5.1 ADMIN

Admin has complete control over the hackathon.

Admin can:

* Import Unstop Excel
* View all teams
* Search/filter teams
* View complete team details
* Edit team details
* Delete teams
* Review PPT
* Review idea
* Shortlist
* Reject
* View payment status
* View confirmed teams
* View final submissions
* Manage Editorial members
* Create unlimited Editorial accounts
* Assign projects to Editorial members
* Reassign projects
* View all judging scores
* View which judge gave which score
* View judging comments
* View audit logs
* Manage hackathon settings
* Manage announcements
* Manage WhatsApp link
* View rankings
* Publish results
* Manage certificates

---

# 6. ADMIN HACKATHON WORKSPACE

## CRITICAL UX REQUIREMENT

The Admin should NOT have to navigate through unrelated Code-A-Nova admin pages to manage the hackathon.

There should be one dedicated:

# `Hackathon Management Workspace`

Everything required to manage the hackathon should be available inside this workspace.

Suggested internal tabs:

```text
Overview
Teams
Editorial
Submissions
Judging
Results
Certificates
Settings
Audit Logs
```

These are sections/tabs inside the Hackathon workspace, not unrelated admin modules.

---

# 7. ADMIN OVERVIEW

The Hackathon Overview should display live statistics.

Example:

```text
Total Teams              1,250
PPT Submitted            1,180
Under Review               900
Shortlisted                300
Payment Pending             53
Confirmed                  247
Final Submissions          221
Projects Evaluated         180
```

Also show:

* Hackathon start countdown
* Submission deadline
* Judging progress
* Certificate generation progress
* Recent admin activity
* Recent editorial activity

---

# 8. UNSTOP EXCEL IMPORT

Admin must be able to upload the Excel file exported from Unstop.

## Flow

```text
Import Unstop Data
        ↓
Upload Excel
        ↓
Validate
        ↓
Preview
        ↓
Confirm Import
        ↓
Database
```

## Import Requirements

The system should:

* Read all available relevant columns.
* Preserve Unstop Application ID.
* Import team information.
* Import leader information.
* Import member information.
* Import college information.
* Import state/location information.
* Import track/category.
* Import idea/project information.
* Import PPT/file/link information.
* Import GitHub/linkedin/other links if available.
* Preserve original imported values.
* Detect duplicate applications/teams.
* Show import errors before final import.

## Import Preview

Before committing:

```text
Total Rows: 1250
Valid: 1238
Duplicates: 8
Errors: 4

[ Cancel ]
[ Import Valid Records ]
```

Admin should be able to see the reason for invalid records.

---

# 9. TEAM DATA MANAGEMENT

Every team must have a dedicated team profile.

Example:

```text
TEAM
Code Warriors

Team ID
CAN-1024

TRACK
Artificial Intelligence

LEADER
Rahul Sharma

MOBILE
+91 XXXXX XXXXX

EMAIL
rahul@example.com

COLLEGE
XYZ College

STATE
Uttar Pradesh
```

## Team Members

Show:

* Member name
* Member role
* College
* State
* Other imported information

## Project / Idea

Show:

* Idea name
* Idea description
* Problem statement
* Proposed solution
* Technology information
* Other idea-related information imported from Unstop

## Submitted Materials

Show:

* PPT
* Hosted link
* GitHub
* LinkedIn
* Demo/video link
* Other relevant submitted links/files

---

# 10. ADMIN TEAM ACTIONS

Admin must be able to:

```text
View
Edit
Delete
Shortlist
Reject
Restore (if applicable)
```

Admin must be able to update imported data when required.

Any important modification should be recorded in the Admin Audit Log.

---

# 11. PPT / IDEA REVIEW

Admin reviews teams based primarily on:

* PPT quality
* Idea quality
* Innovation
* Feasibility
* Relevance
* Overall potential

Admin can optionally use an internal evaluation score.

Example:

```text
Innovation       /10
Idea Quality     /10
Feasibility      /10
Presentation     /10
```

Or simply:

```text
[ SHORTLIST ]
[ REJECT ]
```

The final implementation should support configurable criteria if possible.

---

# 12. SHORTLIST AUTOMATION

When Admin clicks:

`SHORTLIST`

System must:

1. Validate that the team is eligible.
2. Change status to `SHORTLISTED`.
3. Record the action in audit logs.
4. Trigger the shortlist email to the team leader.
5. Make ₹49 confirmation available to the team.
6. Show shortlisted status on the participant dashboard.

Email must be sent automatically.

---

# 13. EMAIL SYSTEM

Shortlisted email should contain:

* Congratulations message
* Team name
* Shortlisting confirmation
* ₹49 participation confirmation information
* Dashboard/confirmation link
* Deadline if applicable
* Basic next-step instructions

The email should clearly state that:

**₹49 is a mandatory participation confirmation fee per team and is applicable after shortlisting.**

---

# 14. PARTICIPANT HACKATHON CARD

On the existing Code-A-Nova `My Dashboard`, display a dedicated Hackathon card.

The card must have a visually distinct hackathon identity.

It should feel energetic and different from normal dashboard cards.

Example:

```text
CODE-A-NOVA HACKATHON

BUILD • INNOVATE • COMPETE

Your team is participating!

[ ENTER HACKATHON ]
```

The card should dynamically show relevant status:

* Shortlisted
* Payment Pending
* Confirmed
* Hackathon Live
* Submission Pending
* Submitted
* Judging
* Results
* Certificate Available

---

# 15. PARTICIPANT HACKATHON PAGE

Route:

`/hackathon`

The page should feel like a dedicated hackathon experience.

## Top section

Display:

* Code-A-Nova Hackathon branding
* Hackathon title
* User's logged-in account
* User name
* Masked email or email as appropriate
* Logout/account option

If the user is already logged in to Code-A-Nova:

**Do NOT ask them to login again.**

Reuse the existing authenticated session.

If not logged in:

Show the normal Code-A-Nova login/OTP flow.

---

# 16. HACKATHON HERO / COUNTDOWN

Display:

```text
CODE-A-NOVA HACKATHON

Hackathon starts in:

05 : 18 : 42 : 17
Days Hours Minutes Seconds
```

Countdown must be based on server-configured hackathon start time.

After start:

```text
🔴 HACKATHON IS LIVE

Time Remaining:
23 : 41 : 08
```

After the deadline:

```text
SUBMISSION CLOSED
```

---

# 17. PARTICIPANT TEAM DETAILS

Display all relevant imported information.

## Team

* Team name
* Track

## Leader

* Name
* Mobile
* Email
* College
* State
* Other relevant imported information

## Team Members

Display all team members.

Participant should be able to see their team information.

---

# 18. PREVIOUS PPT / IDEA

Display the original submission.

Example:

```text
Initial Idea Submission

Idea:
AI Study Assistant

Description:
...

PPT:
[ VIEW PPT ]
```

This should represent the original submission used during the shortlisting process.

---

# 19. PARTICIPATION STATUS

Before payment:

```text
🟡 SHORTLISTED

Participation Confirmation Pending

₹49 / Team

[ CONFIRM PARTICIPATION ]
```

After payment:

```text
🟢 PARTICIPATION CONFIRMED

₹49 Paid
```

Payment status must come from backend-verified payment records.

---

# 20. WHATSAPP GROUP

After confirmation:

```text
OFFICIAL HACKATHON COMMUNITY

Join the official WhatsApp group
for important updates.

[ JOIN WHATSAPP GROUP ]
```

The WhatsApp link should NOT be visible to unconfirmed teams.

Admin should be able to change the WhatsApp group link from Hackathon Settings.

---

# 21. HACKATHON INFORMATION

Participant dashboard should include:

* Hackathon rules
* Tracks
* Timeline
* Judging criteria
* Submission guidelines
* Important announcements
* Problem statement
* FAQ if required

Admin should be able to manage/update this content.

---

# 22. PROJECT DEVELOPMENT PHASE

The hackathon is fully online.

Participants will develop their project independently.

The platform does NOT need to manage:

* Live coding sessions
* Physical attendance
* Physical check-in
* On-site activities

The platform primarily manages:

* Communication
* Submission
* Judging
* Results
* Certificates

---

# 23. FINAL PROJECT SUBMISSION

Participant dashboard must contain a dedicated submission section.

Required fields should be configurable by Admin.

Default fields:

```text
Project Name
Project Description

GitHub Repository
Hosted Project Link
LinkedIn Post/Profile
Demo Video

Additional Links
Additional Files
```

Admin may add/remove required submission fields through Hackathon Settings if technically practical.

---

# 24. SUBMISSION VALIDATION

Before submission:

* Required fields must be validated.
* URLs must be validated.
* Required files must be present.
* Team must be confirmed.
* Submission must be within the deadline.

Only confirmed teams can submit the final project.

---

# 25. FINAL SUBMISSION STATUS

After successful submission:

```text
🟢 PROJECT SUBMITTED

Submitted At:
04 September 2026, 08:42 PM

GitHub        ✓
Hosted Link   ✓
LinkedIn      ✓
Demo Video    ✓
```

If editing is allowed:

`[ EDIT SUBMISSION ]`

After deadline:

```text
🔒 SUBMISSION CLOSED
```

---

# 26. EDITORIAL / JUDGE SYSTEM

Editorial members have a completely separate dashboard.

Route:

`/hackathon/editorial`

Separate login:

`/hackathon/editorial/login`

Editorial members will receive credentials created by Admin.

---

# 27. EDITORIAL MEMBER MANAGEMENT

Admin can create as many Editorial/Judge accounts as required.

Fields:

```text
Name
Email / Login ID
Password
Role
Status
```

Admin can:

* Create judge
* Edit judge
* Activate judge
* Deactivate judge
* Reset password
* Assign projects
* Reassign projects
* View evaluations
* View audit logs

Passwords must NEVER be stored as plain text.

Use secure password hashing.

Admin can set/reset credentials but should not be able to retrieve stored plain-text passwords.

---

# 28. EDITORIAL PERMISSIONS

Editorial members should only see judging-related information.

They should see:

* Team name
* Team leader name
* Team member names
* Idea name
* Idea description
* Idea-related information
* PPT
* Hosted project link
* GitHub
* LinkedIn
* Other relevant project materials
* Evaluation form

They should NOT see:

* Participant phone number
* Participant email
* ₹49/payment information
* Unstop application details
* Admin notes
* Shortlisting history
* Other judges' scores
* Admin settings
* Certificate management
* Result publishing
* Other teams unless assigned

---

# 29. EDITORIAL PROJECT VIEW

Example:

```text
TEAM
Code Warriors

LEADER
Rahul Sharma

MEMBERS
Amit Kumar
Priya Singh
Rohan Singh

IDEA
AI Study Assistant

DESCRIPTION
...

PPT
[ OPEN PPT ]

HOSTED PROJECT
[ OPEN PROJECT ]

GITHUB
[ OPEN REPOSITORY ]

LINKEDIN
[ OPEN LINK ]
```

Then:

```text
EVALUATION

Innovation          /10
Problem Solving     /10
Technical Quality   /10
Functionality       /10
UI/UX               /10
Code Quality        /10
Scalability         /10

Comments
[________________________]

[ SAVE ]
[ SUBMIT EVALUATION ]
[ FINALIZE EVALUATION ]
```

Criteria should be configurable by Admin if possible.

---

# 30. CODE QUALITY EVALUATION

Editorial judges must be able to inspect the submitted GitHub/code repository.

Code Quality can consider:

* Code structure
* Readability
* Maintainability
* Documentation
* Best practices
* Technical implementation
* Security considerations
* Overall code quality

Final score should be entered by the judge.

---

# 31. JUDGE ASSIGNMENT

Admin decides which Editorial members evaluate which teams.

Example:

```text
Team CAN-1024

Judge A ✓
Judge B ✓
Judge C ✓
Judge D ✗
```

Admin can:

* Assign
* Remove assignment
* Reassign

All assignment changes must be recorded in the audit log.

---

# 32. MULTIPLE JUDGES

A project can be evaluated by multiple judges.

Each judge submits an independent evaluation.

Example:

```text
Judge A = 85/100
Judge B = 89/100
Judge C = 87/100
```

System calculates the configured final score.

Default recommended calculation:

```text
Final Score =
Average of all valid judge scores
```

The calculation method should be configurable if required.

---

# 33. WINNER CALCULATION

The final ranking will be based on Editorial Team scores.

Example:

```text
1. Team Alpha       92.50
2. Code Warriors    90.67
3. Tech Titans      88.33
```

Highest valid final score receives the highest position.

The system should automatically generate rankings.

---

# 34. TIE HANDLING

If two or more teams have the same final score:

```text
⚠️ TIE DETECTED
```

Admin should be able to resolve the tie using a configured tie-break rule or manual final decision.

The system must record the resolution in the audit log.

---

# 35. ADMIN SCORE VISIBILITY

Admin must be able to see:

* Final score
* Every judge's score
* Criteria-wise scores
* Judge comments
* Evaluation status
* Submission time
* Evaluation time

Example:

```text
Team: Code Warriors

Judge A
Innovation: 9
Technical: 9
Code Quality: 8
Total: 86/100

Judge B
Innovation: 10
Technical: 8
Code Quality: 9
Total: 89/100

Final Score: 87.50
```

Editorial members should NOT see other judges' scores.

---

# 36. EVALUATION FINALIZATION

Once a judge finalizes an evaluation:

```text
Evaluation Status = FINALIZED
```

After finalization, editing should either:

* Be disabled, OR
* Require a controlled revision process.

If a revision is allowed, the old value must remain in the audit history.

---

# 37. EDITORIAL AUDIT LOG

Every important Editorial action must be recorded.

Required events:

* Login
* Logout
* Project opened
* PPT viewed
* Hosted link opened
* GitHub link opened
* LinkedIn link opened
* Evaluation started
* Score submitted
* Score changed
* Comments added
* Comments updated
* Evaluation finalized
* Assignment changes
* Other important judging actions

---

# 38. AUDIT LOG DATA

Each audit event should record, where applicable:

```text
Event ID
Actor ID
Actor Name
Role
Action
Team ID
Project ID
Timestamp
Previous Value
New Value
Reason
IP / Session metadata if appropriate
```

Example:

```text
04 Sep 2026
11:42 AM

Judge:
Editorial Member A

Team:
CAN-1024

Action:
SCORE_SUBMITTED

Total:
52/60
```

Score modification:

```text
Action:
SCORE_CHANGED

Criteria:
Code Quality

Previous:
8

New:
9

Reason:
Updated after repository review
```

---

# 39. AUDIT LOG SECURITY

Audit logs should be treated as historical records.

Normal Admin operations should NOT allow:

* Editing audit history
* Deleting audit history
* Overwriting previous values

The audit system should provide a reliable historical record.

Admin can:

* View
* Filter
* Search
* Export if required

---

# 40. ADMIN AUDIT LOG

Important Admin actions should also be logged.

Examples:

* Login
* Import
* Team creation
* Team edit
* Team deletion
* Shortlist
* Reject
* Judge creation
* Judge deactivation
* Project assignment
* Project reassignment
* Payment-related administrative action
* Result publication
* Certificate generation
* Settings changes

---

# 41. RESULTS

After judging is complete:

Admin sees:

```text
FINAL RANKING

1st   Team Alpha       94.20
2nd   Code Warriors    91.80
3rd   Tech Titans      89.40
```

Admin can review everything before publishing.

Only Admin can publish the final results.

---

# 42. PARTICIPANT RESULT PAGE

Once results are published:

Participant sees:

```text
🏆 HACKATHON RESULTS

Team:
Code Warriors

Position:
🥇 1st Place
```

For non-winning teams, show an appropriate participation/result message.

Whether exact scores are visible to participants should be controlled by an Admin setting.

---

# 43. CERTIFICATES

Certificates will be made available on the portal within **7 days** after the relevant result/certificate process.

Participant dashboard:

Before generation:

```text
Certificate

Your certificate will be available
within 7 days.
```

After generation:

```text
📜 Certificate Available

[ VIEW CERTIFICATE ]
[ DOWNLOAD CERTIFICATE ]
```

Admin must be able to manage certificate generation/status.

---

# 44. HACKATHON SETTINGS

All configurable hackathon values should be managed from one Settings section.

Possible settings:

```text
Hackathon Name
Description
Start Date/Time
End Date/Time
Submission Deadline
WhatsApp Group Link
Participation Fee
Judging Criteria
Result Visibility
Certificate Settings
Announcements
Rules
Tracks
```

The ₹49 amount should ideally be configurable rather than hardcoded.

Default:

`₹49 / Team`

---

# 45. ANNOUNCEMENTS

Admin should be able to publish announcements.

Participant dashboard should display:

```text
📢 Announcements

Important:
Final submission deadline has been extended...
```

Admin should be able to:

* Create
* Edit
* Publish
* Unpublish
* Delete announcements

Important changes should optionally trigger email notifications.

---

# 46. DATABASE DESIGN

Suggested core entities:

```text
hackathons
hackathon_teams
hackathon_members
hackathon_submissions
hackathon_payments
hackathon_editorial_members
hackathon_judge_assignments
hackathon_evaluations
hackathon_results
hackathon_certificates
hackathon_announcements
hackathon_audit_logs
hackathon_settings
```

The exact implementation should reuse the existing Code-A-Nova database architecture wherever practical.

Do NOT duplicate user authentication if the existing authentication system can be reused.

---

# 47. TEAM STATUS MODEL

Recommended statuses:

```text
IMPORTED
UNDER_REVIEW
SHORTLISTED
REJECTED
PAYMENT_PENDING
CONFIRMED
SUBMISSION_PENDING
SUBMITTED
UNDER_EVALUATION
EVALUATED
RESULT_PUBLISHED
CERTIFICATE_AVAILABLE
```

The backend should control valid status transitions.

---

# 48. PAYMENT STATUS MODEL

```text
NOT_REQUIRED
PENDING
PROCESSING
PAID
FAILED
REFUNDED
```

Only verified successful payment should result in:

```text
Participation Status = CONFIRMED
```

---

# 49. SECURITY REQUIREMENTS

The system must implement role-based access control.

### Admin

Full access.

### Editorial

Only assigned judging functionality.

### Participant

Only their own team and hackathon information.

Users must never be able to access another team's data by changing a URL ID.

Example:

```text
/hackathon/team/1024
```

must validate authorization server-side.

Do not rely only on frontend hiding.

---

# 50. AUTHENTICATION

## Participant

Reuse existing Code-A-Nova authentication.

If already logged in:

```text
My Dashboard
     ↓
Hackathon
     ↓
Direct Access
```

No second login.

## Editorial

Separate Editorial login using Admin-created credentials.

---

# 51. RESPONSIVE DESIGN

Participant portal must work on:

* Desktop
* Laptop
* Tablet
* Mobile

Admin panel should prioritize desktop but remain responsive.

Editorial judging dashboard should work comfortably on laptop/desktop and remain usable on tablet.

---

# 52. UI / DESIGN DIRECTION

The Hackathon area should have a **distinct visual identity** from the normal Code-A-Nova dashboard.

Desired feeling:

* Energetic
* Competitive
* Modern
* Technology-focused
* Premium
* Fast
* Clean

Avoid making it look like a generic CRUD dashboard.

Participant-facing page should feel like entering a real hackathon environment.

Admin panel can remain functional and information-dense.

Editorial panel should prioritize clarity and evaluation speed.

---

# 53. DEVELOPMENT PHASES

The developer MUST NOT attempt to build everything at once.

Build and test sequentially.

## PHASE 1 — Foundation

Build:

* Hackathon database structure
* Hackathon route
* Hackathon settings
* Role permissions
* Existing authentication integration
* Basic Hackathon workspace

Test completely before proceeding.

---

## PHASE 2 — Unstop Import

Build:

* Excel upload
* Validation
* Preview
* Duplicate detection
* Import
* Team/member/project data storage

Test with real/sample Unstop Excel.

---

## PHASE 3 — Admin Team Management

Build:

* Team list
* Search
* Filters
* Team profile
* Edit
* Delete
* PPT viewing
* Link management
* Idea viewing
* Shortlist/reject

Test all CRUD operations.

---

## PHASE 4 — Shortlisting + Email

Build:

* Shortlist action
* Status transitions
* Automatic email
* Confirmation link
* Email logging

Test:

```text
Admin Shortlist
→ Database
→ Email
→ Participant
```

---

## PHASE 5 — Participant Hackathon Experience

Build:

* My Dashboard Hackathon card
* `/hackathon`
* Account information
* Countdown
* Team details
* Members
* Original PPT
* Idea
* Status

Test logged-in and logged-out states.

---

## PHASE 6 — ₹49 Payment

Build:

* Payment screen
* ₹49/team logic
* Payment gateway
* Server-side verification
* Webhook
* Payment status
* Confirmation status
* Success screen

Test failed, cancelled, duplicate and successful payments.

---

## PHASE 7 — WhatsApp + Hackathon Dashboard

Build:

* Confirmed status
* WhatsApp group link
* Rules
* Tracks
* Announcements
* Timeline
* Problem statement

---

## PHASE 8 — Final Submission

Build:

* Submission form
* GitHub
* Hosted link
* LinkedIn
* Demo/video
* Files
* Validation
* Deadline lock
* Edit submission if allowed

---

## PHASE 9 — Editorial System

Build:

* Editorial login
* Judge account creation
* Judge management
* Project assignment
* Editorial dashboard
* Project review page
* Evaluation form

---

## PHASE 10 — Judging + Audit

Build:

* Multiple judges
* Scores
* Comments
* Finalization
* Score calculation
* Ranking
* Complete editorial audit logs
* Admin score visibility

---

## PHASE 11 — Results

Build:

* Final rankings
* Tie handling
* Admin review
* Publish results
* Participant results page

---

## PHASE 12 — Certificates

Build:

* Certificate generation/management
* Certificate status
* Participant certificate page
* View/download
* 7-day availability workflow

---

# 54. TESTING REQUIREMENT

Every phase must be tested before moving to the next phase.

Developer should test:

### Functional

* CRUD
* Authentication
* Authorization
* Payment
* Email
* File upload
* URL validation
* Status transitions
* Judging
* Ranking

### Security

* Unauthorized team access
* Unauthorized Admin access
* Unauthorized Editorial access
* URL manipulation
* Payment manipulation
* Role escalation
* Audit log tampering

### Edge Cases

* Duplicate Unstop team
* Missing PPT
* Invalid Excel
* Invalid email
* Failed payment
* Duplicate payment webhook
* User refresh after payment
* Multiple browser sessions
* Judge submits twice
* Judge changes score
* Deadline reached during submission
* Tie in results

---

# 55. IMPORTANT IMPLEMENTATION RULES FOR DEVELOPER

1. Do not break existing Code-A-Nova functionality.
2. Reuse existing authentication where possible.
3. Reuse existing database conventions where possible.
4. Do not duplicate user accounts unnecessarily.
5. Do not store passwords in plain text.
6. Do not trust frontend payment success.
7. Use backend payment verification/webhooks.
8. Use server-side authorization for every protected resource.
9. Do not expose participant private information to Editorial members.
10. Do not expose one team's private data to another team.
11. Do not expose one judge's scores to another judge.
12. Preserve audit history.
13. Do not hardcode hackathon dates if they can be managed through settings.
14. Do not hardcode the ₹49 amount if configurable settings are available.
15. Build in phases.
16. Test each phase before starting the next.
17. Keep the Admin Hackathon workspace centralized.
18. Avoid unnecessary pages and navigation.
19. Maintain responsive design.
20. Keep the participant experience visually distinct and energetic.

---

# 56. FINAL SYSTEM STRUCTURE

```text
CODE-A-NOVA
│
├── Existing Website
│
├── My Dashboard
│      │
│      └── 🚀 Hackathon Card
│
├── /hackathon
│      │
│      ├── Dashboard
│      ├── Team
│      ├── Idea / PPT
│      ├── Timeline
│      ├── Announcements
│      ├── Submission
│      ├── Results
│      └── Certificate
│
└── ADMIN
       │
       └── HACKATHON WORKSPACE
              │
              ├── Overview
              ├── Teams
              ├── Editorial
              ├── Submissions
              ├── Judging
              ├── Results
              ├── Certificates
              ├── Settings
              └── Audit Logs
```

---

# 57. CORE PRINCIPLE

The system should follow this principle:

> **Unstop is the initial registration and PPT collection platform. Code-A-Nova is the complete hackathon management platform after data import.**

The participant should not need to repeatedly return to Unstop.

After the initial registration/PPT phase, the participant journey should happen primarily on Code-A-Nova:

```text
Shortlisted
    ↓
Email
    ↓
Code-A-Nova
    ↓
₹49 Confirmation
    ↓
Confirmed
    ↓
Hackathon Dashboard
    ↓
Project Development
    ↓
Final Submission
    ↓
Judging
    ↓
Results
    ↓
Certificate
```

The Admin should have complete operational control.

The Editorial Team should have independent judging access.

The Participant should have a clean, simple, dedicated hackathon experience.

The system must maintain a complete audit trail for important administrative and judging actions.
