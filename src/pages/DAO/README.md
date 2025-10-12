# DAO Page Implementation

## Overview
The DAO page has been created to match the design specifications exactly, reusing existing components from the project architecture (BrowseJobs, Governance, and JobsTable patterns).

## Component Structure

### Reused Components
- **Button** - For "Refer & Earn" button
- **BlueButton** - For "Join DAO" and "New Proposal" buttons
- **DropDown** - For "DAO View" and "Proposals" filters
- **SearchInput** - For search functionality
- **FilterOption** - For "Table Columns" filter
- **DetailButton** - For info buttons in stat cards
- **BackButton** - Via Link component for navigation

### Web3 Integration
The page follows the same pattern as BrowseJobs:
- Initializes Web3 with OP Sepolia RPC
- Sets up contract instance with ABI
- Uses mock data temporarily while contract methods are implemented
- Includes loading states and error handling

## Design Specifications

### CSS Variables (from reference)
```css
:root {
  --basewhite: rgba(255, 255, 255, 1);
  --brand-600: rgba(127, 86, 217, 1);
  --gray-200: rgba(234, 236, 240, 1);
  --gray-700: rgba(52, 64, 84, 1);
  --graymain: rgba(134, 134, 134, 1);
}
```

### Typography
- Font Family: 'Satoshi', sans-serif
- Font Weights: 400 (Regular), 500 (Medium), 700 (Bold)
- Follows same styling as JobsTable component

### Layout Structure
1. **Header Section** (`.title-section.back-section`)
   - Back button linking to /governance
   - Title: "OpenWork DAO"
   - "Refer & Earn" button

2. **Stats Cards Section** (`.box-section`)
   - Skill Oracles: 12
   - DAO Members: 120
   - My Current Stakings: 0 (with "Join DAO" button)

3. **Ledger Section** (`.title-section`)
   - Title: "OpenWork Ledger"
   - Dropdowns: "DAO View", "Proposals"

4. **Filter Section** (`.filter-section`)
   - Search input
   - "Table Columns" filter
   - "New Proposal" button

5. **Proposals Table**
   - Headers: Request Title, Proposed By, Vote Submissions, Type, Time Left, Actions
   - Progress bars with color coding:
     - Orange (#FFA500): In-progress proposals
     - Green (#00C853): Passing proposals
     - Red (#F44336): Failing proposals

6. **Pagination**
   - Centered layout
   - Previous/Next buttons
   - "Page X of Y" display

## Mock Data Structure
```javascript
{
  id: "0x1234",
  title: "OpenWork Token Contract Upgrade",
  proposedBy: "0xDEAF...f8BB",
  voteSubmissions: 70, // percentage
  type: "Upgrade",
  timeLeft: "2 days",
  color: "#FFA500"
}
```

## Contract Integration (TODO)
Replace mock data with actual contract calls:

```javascript
// Fetch proposal count
const proposalCount = await contract.methods.getProposalCount().call();

// Fetch proposal details
const proposalData = await contract.methods.getProposal(proposalId).call();

// Fetch voting statistics
const votes = await contract.methods.getProposalVotes(proposalId).call();
```

## Measurements & Spacing
Following JobsTable component specifications:
- Page padding: 28px 24px
- Table cell padding: 20px 24px (body), 12px 24px (header)
- Box section spacing: standard grid layout
- Font sizes: 14px (body), 12px (labels)

## Navigation
- Back: /governance
- New Proposal: /vote-proposal
- View Proposal: /vote-submission?id={proposalId}

## Testing Checklist
- [ ] Layout matches reference design
- [ ] All components render correctly
- [ ] Web3 initializes without errors
- [ ] Mock data displays properly
- [ ] Progress bars show correct percentages and colors
- [ ] Navigation links work
- [ ] Pagination functions correctly
- [ ] Responsive on different screen sizes
- [ ] Loading states display properly
- [ ] Icons and images load correctly

## File Structure
```
src/pages/DAO/
├── DAO.jsx          # Main component with Web3 integration
├── DAO.css          # Styling following JobsTable patterns
└── README.md        # This file
```

## Dependencies
- Web3.js for blockchain interaction
- React Router for navigation
- nowjc_ABI.json for contract interface
- Existing UI components from components directory

## Notes
- The page uses the same table styling as JobsTable component
- Box section follows the same pattern used in other governance pages
- All measurements and spacing match the reference code provided
- CSS variables from :root are used for consistent theming
