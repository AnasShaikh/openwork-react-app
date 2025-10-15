# Copilot Instructions for OpenWork React App

## Overview
This project is a React-based web application built with Vite. It includes a modular component structure, TypeScript support, and integration with smart contracts for blockchain-based functionality. The app is designed to be fast, maintainable, and scalable.

## Key Directories and Files
- **`src/`**: Contains the main application code.
  - **`components/`**: Reusable UI components (e.g., `Button`, `ProgressBar`, `ToolTipContent`).
  - **`pages/`**: Page-level components representing different views (e.g., `BrowseJobs`, `JobUpdate`, `Profile`).
  - **`functions/`**: Utility functions and hooks (e.g., `useWalletConnection.js`, `handleContractCreation.js`).
  - **`ABIs/`**: Contains JSON files for interacting with smart contracts.
- **`contracts/`**: Solidity smart contracts used in the application.
- **`public/`**: Static assets like fonts and images.
- **`vite.config.js`**: Configuration for Vite.
- **`tsconfig.json`**: TypeScript configuration.

## Architecture
- **Component-Based Design**: The app follows a modular architecture where UI components are reusable and composable.
- **Smart Contract Integration**: The app interacts with blockchain smart contracts using ABIs stored in `src/ABIs/`.
- **State Management**: State is managed locally within components or via React Context API (if applicable).

## Developer Workflows
### Running the App
- Use the `dev` script to start the development server:
  ```bash
  npm run dev
  ```

### Building for Production
- Use the `build` script to create a production build:
  ```bash
  npm run build
  ```

### Testing
- Currently, no specific testing framework is set up. Add tests in the `src/tests/` directory if needed.

### Debugging
- Use browser developer tools and React DevTools for debugging.
- Check the `vite.config.js` file for custom configurations that might affect debugging.

## Project-Specific Conventions
- **File Naming**: Use PascalCase for component files (e.g., `MyComponent.jsx`) and camelCase for utility functions (e.g., `formatWalletAddress.js`).
- **Styling**: CSS files are colocated with their respective components or pages.
- **Smart Contract Interaction**: Use the ABIs in `src/ABIs/` to interact with contracts. Refer to `functions/handleContractCreation.js` for examples.

## External Dependencies
- **Vite**: For development and build processes.
- **React**: For building the user interface.
- **Solidity**: For smart contract development (contracts are in the `contracts/` directory).

## Pages and Components

### Pages
The `src/pages/` directory contains the following page-level components, each representing a distinct view or feature:
- **About**: Information about the platform.
- **AddMember**, **RemoveMember**, **AddUpdate**: Member management and updates.
- **ApplyJob**, **ApplyNow**: Job application workflows.
- **BrowseJobs**, **BrowseTalent**: Browsing jobs and talent.
- **DAO**: DAO governance page with proposals, voting statistics, and member management.
- **JoinDAO**: Join the DAO page with staking information and Join DAO button. Shows minimum staking amount (1,000,000 OW tokens), current balance, and information about OpenWork DAO governance. Links to About page for OpenWork Paper.
- **Newproposel**: New Proposal creation page with selection of 6 proposal types (Treasury, OpenWork Job, Contract Upgrade, Contract Update, Skill Oracle, Skill Oracle Member). Each proposal type is displayed as a clickable card with icon and arrow.
- **TreasuryProposal**: Treasury Proposal form page with wallet selection dropdown, amount input, receiver wallet display, description textarea, and file upload. Includes Submit Proposal button. Shows wallet balance and OW token icons.
- **ContractUpgradeProposal**: Contract Upgrade Proposal selection page where users select which contract to upgrade (OpenWork DAO Smart Contract, OpenWork Token Smart Contract, OpenWork's Athena (Skill Oracles), or OpenWork's Job Contract). Each contract option is displayed as a clickable item with a file icon and right arrow.
- **SkillOracleProposal**: Skill Oracle Proposal selection page where users choose between creating a new Skill Oracle or dissolving an existing one. Each option is displayed with a circular icon wrapper and right arrow. Icons have blue background circles.
- **SkillOracleMemberProposal**: Skill Oracle Member Proposal selection page (Desktop-126) where users choose between recruiting a new member to a Skill Oracle or removing an existing member. Features 2 options with circular blue icon wrappers (rgba(18,70,255,0.06)), 14px gray description text (#868686), and right-pointing arrows (transform: rotate(90deg)). Routes to /joinee-application and /removal-application.
- **DirectContractForm**, **PostJob**: Job posting and direct contracts.
- **Governance**, **MembersGovernance**: Governance-related views.
- **JobDeepView**, **JobUpdate**, **SingleJobDetails**: Detailed job views and updates.
- **Notification**, **PaymentHistory**, **Payments**, **PaymentRefund**: Notifications and payment-related views.
- **Profile**, **ProfileAbout**, **ProfileJobs**, **ProfileOwnerView**: User profile views.
- **RaiseDispute**, **ReviewDispute**: Dispute management.
- **RecruitmentApplication**, **SkillOracle**, **SkillVerificationApplication**: Recruitment and skill verification.
- **ViewJobs**, **ViewJobDetails**, **ViewWork**: Viewing jobs and work submissions.
- **VoteProposal**, **VoteSubmission**, **VotingHistory**: Voting-related views.

### Reusable Components
The `src/components/` directory contains modular and reusable UI components:
- **Loading**: Displays a loading spinner with an icon.
- **MenuItem**: A navigational menu item with hover effects.
- **Button**, **BlueButton**, **BackButton**: Various button styles.
- **Collapse**, **ComboBox**, **DropDown**: Interactive UI elements.
- **ConnectWallet**: Handles wallet connection for blockchain interactions.
- **JobItem**, **JobsTable**: Displays job listings.
- **Milestone**, **ProgressBar**, **VoteBar**: Progress and voting indicators.
- **PaymentItem**, **TransactionItem**: Payment-related components.
- **SkillBox**, **ToolTipContent**, **ToolTipMilestone**: Skill and tooltip components.
- **SearchInput**, **RadioButton**, **StatusButton**: Form and input elements.
- **Warning**, **WorkSubmission**: Alerts and work submission components.

### Examples of Usage
#### Adding a New Page
1. Create a new folder in `src/pages/`.
2. Add the page component file (e.g., `MyNewPage.jsx`) and a CSS file for styling.
3. Import and use reusable components from `src/components/` as needed.

#### Using Reusable Components
- **Loading**: Import and use `<Loading />` to display a loading spinner.
- **MenuItem**: Use `<MenuItem />` for navigation with props like `to`, `text`, and `iconSrc`.

### Adding a New Page from a Screenshot

When creating a new page based on a screenshot, follow these detailed steps to ensure consistency with the existing structure and architecture:

1. **Analyze the Screenshot**:
   - Break down the UI into smaller, reusable components.
   - Identify any existing components in `src/components/` that can be reused.
   - Note any new components that need to be created.

2. **Create the Page Directory**:
   - Navigate to `src/pages/`.
   - Create a new folder named after the page (e.g., `NewPage/`).

3. **Build the Page Component**:
   - Inside the new folder, create a main file for the page (e.g., `NewPage.jsx`).
   - Use the following structure for the component:
     ```jsx
     import React from "react";
     import "./NewPage.css"; // Import the CSS file for styling
     import ExistingComponent from "../../components/ExistingComponent"; // Example of reusing a component

     const NewPage = () => {
       return (
         <div className="new-page-container">
           {/* Add your components and layout here */}
           <ExistingComponent />
         </div>
       );
     };

     export default NewPage;
     ```

4. **Style the Page**:
   - Create a CSS file in the same folder (e.g., `NewPage.css`).
   - Follow the BEM (Block Element Modifier) naming convention for class names to maintain consistency.

5. **Reuse Components**:
   - Check the `src/components/` directory for reusable components.
   - If a component needs minor modifications, consider making it more flexible (e.g., by adding props) instead of duplicating it.

6. **Create New Components (if needed)**:
   - If the page requires new components, create them in `src/components/`.
   - Follow the existing structure: each component should have its own folder with an `index.jsx` file and a CSS file.
   - Example structure for a new component:
     ```
     src/components/NewComponent/
       ├── index.jsx
       ├── NewComponent.css
     ```

7. **Integrate the Page**:
   - Add the new page to the routing system in `src/index.jsx` or wherever the routes are defined.
   - Ensure the route path does not conflict with existing pages.

8. **Test the Page**:
   - Verify that the new page renders correctly and does not introduce any visual or functional conflicts with existing pages.
   - Check for responsiveness and cross-browser compatibility.

9. **Document the Page**:
   - Update the `.github/copilot-instructions.md` file to include the new page in the list of pages.
   - Provide a brief description of the page's purpose and any unique components it uses.

By following these steps, you can ensure that new pages are consistent with the existing structure and architecture while avoiding conflicts with old pages.

### Ensuring Design Accuracy with Provided Code and CSS References

When implementing a design based on provided code or CSS references, follow these steps to ensure the output matches the design exactly:

1. **Understand the Design Requirements**:
   - Carefully review the provided code and CSS references.
   - Note the exact measurements, colors, fonts, and spacing specified in the design.

2. **Set Up the Environment**:
   - Ensure your development environment is configured to reflect the design accurately (e.g., correct screen resolution, browser zoom level, etc.).
   - Use tools like browser developer tools to inspect and compare styles.

3. **Implement the Design**:
   - Use the provided code and CSS references as the base.
   - Ensure all measurements (e.g., padding, margin, width, height) are implemented exactly as specified.
   - Use the same units (e.g., `px`, `em`, `%`) as in the references.

4. **Double-Check the Output**:
   - Compare the implemented design with the references side-by-side.
   - Use design tools or browser extensions to measure and verify dimensions, spacing, and alignment.
   - Check for pixel-perfect accuracy.

5. **Test Responsiveness**:
   - Verify that the design behaves as expected on different screen sizes and devices.
   - Ensure that responsive styles match the design references.

6. **Iterate and Refine**:
   - If any discrepancies are found, adjust the code and CSS until the design matches the references exactly.
   - Re-test after making changes to ensure no new issues are introduced.

7. **Document the Implementation**:
   - Update the `.github/copilot-instructions.md` file or other relevant documentation to include details about the design implementation.
   - Note any deviations from the references and the reasons for them (if applicable).

By following these steps, you can ensure that the implemented design matches the provided references with precision.

### Testing Results with Context7 and Playwright MCP

To ensure the accuracy and functionality of the implemented design or feature, use Context7 and Playwright MCP for automated testing. Follow these steps:

1. **Set Up Context7**:
   - Ensure Context7 is installed and configured in your environment.
   - Use Context7 to validate the design implementation against the provided references.
   - Generate detailed reports to identify any mismatches or inconsistencies.

2. **Integrate Playwright MCP**:
   - Install Playwright MCP for browser-based testing.
   - Write test scripts to simulate user interactions and verify the behavior of the implemented feature.
   - Use Playwright MCP to capture screenshots and compare them with the design references.

3. **Run Automated Tests**:
   - Execute the Context7 and Playwright MCP test scripts.
   - Ensure that all tests pass without errors.
   - Address any issues identified during the testing process.

4. **Review Test Results**:
   - Analyze the test results to ensure that the implementation meets the design and functional requirements.
   - Re-run tests after making any necessary adjustments to confirm that the issues have been resolved.

5. **Document the Testing Process**:
   - Update the `.github/copilot-instructions.md` file or other relevant documentation to include details about the testing process.
   - Include information about the tools used, test scripts, and results.

By incorporating Context7 and Playwright MCP into your testing workflow, you can ensure that the implemented design and functionality meet the required standards.

### Updating Documentation After Completing a Page

After completing the implementation of a new page, always update the `.github/copilot-instructions.md` file to reflect the changes. Follow these steps:

1. **Add the Page to the Documentation**:
   - Include the new page in the list under the "Pages" section.
   - Provide a brief description of the page's purpose and functionality.

2. **Document New Components**:
   - If the page introduced new reusable components, add them to the "Reusable Components" section.
   - Provide a brief description of each component and its usage.

3. **Update Examples (if applicable)**:
   - If the new page or components introduce new patterns or workflows, update the "Examples of Usage" section with relevant details.

4. **Verify Consistency**:
   - Ensure that the documentation aligns with the project's structure and conventions.
   - Double-check for any outdated information and update it as needed.

5. **Commit the Changes**:
   - Commit the updated `.github/copilot-instructions.md` file along with the new page and components.
   - Use a clear commit message, such as: `Update documentation for new page: [Page Name]`.

By consistently updating the documentation, you ensure that the project remains well-documented and easy to navigate for all contributors.

---

For further details, consult the `README.md` or explore the codebase.