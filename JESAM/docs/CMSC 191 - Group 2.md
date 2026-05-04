# JESAM – Journal Publication
## Requirements Specification

### Distribution of Tasks
**Modules:**
1. Submission - 2 (Dave, Lei)
2. Peer review - 1 (Trina)
3. Revision - 1 (Caleb)
4. Publication & Impact - 2 (Yanna, Russ)
5. Journals Dashboard - 2 (Gabby, Adrian J.)
6. Analytics Dashboard - 1 (Jai)
7. AI Chatbot - 1 (Adrian C.)

### Purpose
Define the end-to-end requirements for JESAM to manage manuscript submissions, peer review, revisions, acceptance, and publication.

### Scope
Applies to initial manuscript submission, editorial handling, reviewer management, decision workflows (desk reject, revise, reject), revision submission, acceptance, production, and final publication.

### Stakeholders
* Authors
* Editors-in-Chief
* Handling Editors / Associate Editors
* Reviewers
* Production Team
* Publisher / IT System Administrator

### Key Assumptions
* Users authenticate via secure accounts.
* Each manuscript has a unique identifier (Manuscript ID).
* Communication (emails/notifications) is tracked and logs are retained.
* Version control for manuscript files (original submission, revisions, proofs).

---

## 1. User Roles and Permissions

**Author**
* Submit new manuscript
* Upload files (manuscript, figures, supplementary material)
* Respond to editor & reviewer comments
* View status and decision history
* Retrieve accepted manuscript and proofs

**Editor / Handling Editor**
* Create and manage manuscript assignments
* Make desk rejection decisions
* Assign reviewers
* Track review progress
* Issue decision letters (e.g., Revise, Reject, Accept)
* Communicate with authors and reviewers

**Reviewer**
* Access assigned manuscripts
* Submit structured reviews (summary, strengths/weaknesses, recommendations)
* Provide confidential comments to editors (optional)

**Production Editor / Publisher**
* Manage accepted manuscripts through copyediting, typesetting, and proofing
* Schedule publication and issue assignment
* Ensure metadata accuracy and indexing requirements

**System Administrator**
* Manage user accounts, roles, and permissions
* Maintain audit logs and security

**Updated (OJS):**
1. Author
2. Editor & Section Editor
3. Journal Manager, Reviewer, Copyeditor, Layout Editor, Proofreader

**From SESAM:**
1. Production Editor
2. Managing Editor
3. Associate Editors
4. Editor in Chief

---

## 2. Manuscript Lifecycle

### 2.1 Intake & Screening Module (Submission Phase)
* *Editor in chief to accept/reject paper*
* *Manuscript code generation*

The Intake & Screening Module serves as the primary gateway for the scientific community. It is designed as a multi-stage validation gate to handle data ingestion (Submission) and automated quality assurance (Similarity Screening). By unifying complex metadata collection with real-time plagiarism detection, this module ensures that only high-quality, original research enters the peer-review pipeline, significantly reducing editorial workload and safeguarding the publication’s reputation.

*(Fig. 1: Intake & Screening Module Flowchart)*

The initial phase captures essential research metadata, including the Title, abstract, keywords, focus of the paper (Land, Air, Water, People), subject area, funding information, competing interests, and ethical approvals. The author’s information must also be provided which includes ORCID iDs, corresponding author, co-authors, and affiliations. This ensures transparency and facilitates automated indexing. Submissions undergo an automated check for formatting which will be verified by the corresponding Editor. This includes template adherence and asset validation, where figure resolutions and "blinded" status are checked. The final gate utilizes automated integration with open-source plagiarism detection tools. Manuscripts are screened for similarity indices where only those meeting the threshold proceed to the Administrative Check, while those with significant overlap are returned to the author for revision or clarification. The Administrative Check requires the author to declare that they have no competing interests and that they adhere to ethical standards in the form of a checkbox.

### 2.2 Administrative Check (Pre-Review)**
* Completeness validation
* Scope and journal fit check
* Blind or non-blind submission handling
* Ethical and copyright checks

### 2.3 Editor-In-Chief
* Desk Reject: manuscript rejected without external review (with rationale)
* Proceed to Review: editor assigns reviewers
* Withdrawn/Cancel: author withdraws submission
* *Heavy on Notifications*

### 2.4 Peer Review Process**
The Peer Review Process serves as the core evaluation mechanism of the journal system, ensuring the quality, validity, and originality of submitted manuscripts. It is designed as a structured, multi-step workflow that manages reviewer assignment, evaluation, certification, and editorial decision-making. By integrating AI-assisted reviewer selection, controlled reviewer allocation, time-bound review submissions with automated reminders, real-time status updates, and standardized evaluation criteria, this module ensures consistency, fairness, and efficiency in assessing scholarly work before publication.

*(Fig. X: Peer Review Process Flowchart)*

The process begins with the editor assigning a minimum of three (3) qualified reviewers, who are automatically matched to manuscripts using an AI-assisted expertise-based assignment system. Once invited, reviewers may either accept or decline the invitation; if a reviewer declines or fails to respond, the system automatically assigns a replacement reviewer to maintain the required minimum number of reviewers. Upon acceptance, reviewers gain access to the manuscript and proceed with the evaluation using a structured review form that includes a summary of findings, identification of major and minor concerns, assessment of validity and originality, and evaluation of relevance and novelty, with each review including a recommendation—Accept, Minor Revision, Major Revision, or Reject—along with optional confidential comments intended for the editor. Each reviewer is given a strict one-week review deadline, enforced through automated reminders, and if a reviewer fails to submit within the allotted period, the manuscript is automatically reassigned to another qualified reviewer. Once the minimum required number of reviews is completed, the editor synthesizes all feedback and makes the final editorial decision; in cases of conflicting recommendations, the editor resolves the outcome based on a consolidated interpretation of reviewer feedback. Upon completion of the review process, reviewers receive a certification of participation from JESAM acknowledging their contribution to the journal, while authors are provided with real-time status updates throughout the process, ensuring transparency and continuous feedback on manuscript progress.

### 2.5 Revision Cycle**
The Revision Cycle module serves as a medium to properly assess journal publication entries by having an in-depth, systematic review of each paper, which undergoes several iterations of revision in order to provide complete and incremental feedback to the authors. It facilitates structured communication between editors, reviewers, and authors by delivering consolidated reviewer comments and enabling authors to submit revised manuscripts along with detailed response letters addressing each point raised.

*(Fig 5. Revision Cycle Flowchart)*

Fig 5 illustrates the revision cycle process followed after a manuscript receives a revision decision. The workflow begins with Start Revision, triggered when the editor issues a revision decision and communicates reviewer comments to the author. Guided by this feedback, the author submits a revised manuscript together with a detailed response letter. Upon submission, the system generates a new manuscript version to ensure proper version control and traceability.

The revised manuscript is then evaluated in the Editor Reviews Revision stage. At this point, the editor determines whether further peer review is necessary. If additional validation is required, the manuscript is reassigned to reviewers, who evaluate the revision and submit updated feedback. The editor consolidates these reviews to support the decision-making process. If further review is not required, the editor proceeds directly to the final evaluation.

The process culminates in the Final Decision stage, where the manuscript is either accepted or rejected. Acceptance advances the manuscript to the subsequent production and publication phases, while rejection terminates the submission. This workflow highlights the iterative and controlled nature of the revision cycle, emphasizing structured feedback, version management, and editorial oversight within the JESAM system.

### 2.6 Acceptance**
* Formal acceptance letter generation
* Author rights and licensing confirmation
* Metadata finalization (title, abstract, keywords, funding, ORCID)
* Copyright transfer or open access agreement as applicable

### 2.7 Production and Publication Preparation**
* *Auto layout (open source)*
* Copyediting and language polishing
* Layout and typesetting
* Figure and table formatting

### 2.8 Publication and Impact Module
The Publication and Impact Module manages the final stages of the manuscript lifecycle, including production, publication, dissemination, and post-publication monitoring. As illustrated in Fig. 8, the process begins once a manuscript is accepted and evaluated for publication readiness. If requirements are incomplete, the manuscript is returned to the revision stage; otherwise, the system proceeds with file finalization and metadata preparation.

The module generates publication-ready files, such as PDF and optional web formats, and compiles structured metadata including title, authors, abstract, and keywords. To support digital identification, the system prepares Crossref-compatible metadata for DOI registration. Given system constraints, DOI assignment may be completed externally, after which the assigned identifier is stored within the system.

Once finalized, the manuscript is scheduled for release either as part of a journal issue or through online-first publication. Upon publication, the system performs parallel actions: (1) publishing the article on a public-facing page where users can access metadata and downloadable content, (2) exporting metadata and redirecting users to official repository submission portals for institutional integration, (3) triggering dissemination through university platforms such as websites, mailing lists, and social media, and (4) exporting metadata to indexing services to enhance research visibility.

Post-publication, the system tracks article-level metrics such as views, downloads, and citation indicators to assess research impact. It also supports correction, errata, and retraction workflows, ensuring that updates to published content are properly processed, logged, and communicated to users. Through these capabilities, the module enables efficient dissemination, visibility, and continuous management of published research outputs.

*(Fig. 8. Publication and Impact Module Flowchart)*

---

## Journals Dashboard
* *list of the journals*
* *upon clicking the journal–readers can view + split screen of the AI summary / chatbot*
* *connected papers - link local journals from JESAM*

## Analytics Dashboard
* *demographic analysis*
* *journal focus analysis (Land, Water, Air, People)*

## AI Chatbot
* *FAQs*
* *Queries regarding formatting etc.*

---

## 3. Data Model (Key Entities)

**Manuscript**
* ManuscriptID, title, abstract, keywords, subjectArea, ethicalApproval, funding, license

**Author**
* AuthorID, name, email, affiliation, ORCID

**Version**
* VersionID, manuscriptID, fileType, fileLocation, timestamp, status

**Review**
* ReviewID, manuscriptID, reviewerID, scores, comments, confidentialToEditor, submissionDate

**Decision**
* DecisionID, manuscriptID, decisionType (Reject/Revise/Accept), rationale, date

**Milestone**
* MilestoneID, manuscriptID, status, date, note

**Communication**
* MessageID, manuscriptID, sender, recipient, subject, body, date

---

## 4. Workflow Rules and Automation

**Desks:**
* Auto-check for scope fit; route to editor if candidate

**Review assignment:**
* Enforce minimum number of reviewers; avoid conflicts of interest

**Deadlines:**
* Each stage has defined SLA; reminders escalate if overdue

**Versioning:**
* Each revision creates a new Version linked to the Manuscript

**Notifications:**
* Event-based emails: submission received, review invitation, decision letters, proofs, publication

**Compliance:**
* Ethical approval, competing interests, data availability statements validated

---

## 5. User Interface Considerations

* Dashboard for each role with status overview
* Clear status tags for manuscripts (Submitted, Under Review, Revision Requested, Accepted, In Production, Published)
* Inline comments and threaded discussions between editors and authors
* Reviewer portal with anonymized submission and review form
* Production portal for copyediting, typesetting, proofs, and metadata editing

---

## 6. Non-Functional Requirements

**Security**
* Role-based access control, secure authentication, audit logs

**Performance**
* Responsive UI, scalable handling of concurrent submissions and reviews

**Reliability**
* 99.9% uptime for submission and review components

**Data Integrity**
* Version history, integrity checks for file uploads

**Compliance**
* GDPR/privacy, data retention policies, consent management

---

## 7. Integration Points

**External services**
* Plagiarism detection
* Crossref/DOI registration
* Indexing services (PubMed, Scopus, Web of Science)
* ORCID integration

**Internal systems**
* Publisher CMS
* Email and notification service
* Payment processing (if applicable for open access)

---

## 8. Acceptance Criteria (Example Scenarios)

**Submission acceptance**
* All required fields and files provided; passes plagiarism check; editorial scope confirmed

**Review process**
* Review invitations sent; at least two reviews received; editor decision based on consolidated feedback

**Revision handling**
* Authors submit revised manuscript with a detailed response to reviewer comments; manuscript version updated

**Final acceptance and publication**
* Manuscript metadata complete; proofs approved; DOI assigned; article published online

---

## 9. Quality Assurance and Testing

* Functional tests for all workflows
* Role-based access tests
* Usability testing with sample editors/authors/reviewers
* Security penetration testing
* End-to-end publishing flow tests from submission to publication

---

## 10. Documentation and Training

* User guides for authors, editors, and reviewers
* Admin/maintenance handbook
* API/documentation for integrations
* Onboarding tutorials and help center

> **Note:** You don't have to start from scratch. Try to look for free and open source Apps you can use to complete the project.
