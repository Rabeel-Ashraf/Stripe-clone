# Merchant Dashboard Documentation

## Overview

The Merchant Dashboard provides a Stripe-style interface for payment merchants to manage their transactions, customers, products, and account settings.

## Pages

### 1. Overview Dashboard (`/dashboard`)

The main dashboard page displays key metrics and insights about your payment activity.

**Components:**
- **Balance Card**: Shows available balance, pending payouts, and next payout date
- **Metrics Row**: Displays 4 key metrics with trends
  - Total Revenue (last 30 days)
  - Total Transactions (last 30 days)
  - Success Rate
  - Average Transaction Value
- **Revenue Chart**: Line chart showing revenue over the last 30 days
- **Status Breakdown**: Pie chart showing transaction status distribution
- **Recent Transactions**: Table of the 10 most recent transactions

### 2. Transactions (`/dashboard/transactions`)

Browse, search, and filter all your transactions.

**Features:**
- Search by transaction ID
- Filter by status (All, Succeeded, Failed, Pending, Refunded)
- Filter by customer email
- Filter by amount range
- Sortable columns
- Pagination (50 per page)
- Export to CSV

**Transaction Detail Page** (`/dashboard/transactions/:id`)
- Full transaction details including card info, fraud scores, and authorization codes
- Refund history
- Refund button to issue full or partial refunds
- Download receipt

### 3. Products (`/dashboard/products`)

Manage your product catalog.

**Features:**
- List all products
- Create new product
- Edit product details
- Delete products
- Add/edit prices for each product
- Set price type (one-time or recurring)
- Configure billing interval for recurring prices

### 4. Customers (`/dashboard/customers`)

Manage your customer base.

**Features:**
- List all customers with statistics
- Search by email
- View customer detail page with:
  - Customer information
  - Total spent
  - Transaction history
  - Subscription status
  - Saved payment methods

### 5. Settings (`/dashboard/settings`)

Configure your account and integrations.

**Tabs:**

#### API Keys
- List all API keys with status
- Create new publishable/secret keys
- Copy secret keys (one-time display)
- Rotate keys
- Revoke keys
- View usage statistics

#### Webhooks
- List webhook endpoints
- Create new webhook
- Configure events (payment.succeeded, payment.failed, charge.refunded, etc.)
- Edit endpoints
- Delete endpoints
- Send test events
- View delivery history and status codes

#### Account Settings
- Update business information
- Change email address
- Update password
- Enable two-factor authentication (TOTP)
- Logout all devices
- Delete account (permanent)

#### Payout Settings
- Configure bank account details
- Set payout schedule (daily, weekly, monthly)
- Set minimum payout amount
- View last payout information
- Update account holder name

#### Billing & Plan
- View current plan
- See plan features and limits
- Upgrade to higher tier
- View billing history and download invoices

## Components

### MetricCard
Displays a metric with value, trend, and direction indicator.
```tsx
<MetricCard
  label="Total Revenue"
  value="$45,230.00"
  trend={12.5}
  trendDirection="up"
  subtext="Last 30 days"
/>
```

### StatusBadge
Displays transaction status with appropriate coloring.
```tsx
<StatusBadge status="succeeded" /> // Green badge
<StatusBadge status="failed" />    // Red badge
<StatusBadge status="pending" />   // Yellow badge
<StatusBadge status="refunded" />  // Blue badge
```

### DataTable
Generic reusable table with sorting and pagination.
```tsx
<DataTable
  columns={columns}
  data={data}
  isLoading={isLoading}
  onRowClick={handleRowClick}
  pageSize={50}
/>
```

### Modal
Modal dialog for forms.
```tsx
<Modal
  isOpen={isOpen}
  title="Create Product"
  onClose={handleClose}
  onSubmit={handleSubmit}
  submitLabel="Create"
>
  {/* Form fields */}
</Modal>
```

## Color Palette

- **Primary Blue**: `#635BFF` (Stripe signature)
- **Success Green**: `#31A24C`
- **Danger Red**: `#FA5252`
- **Warning Yellow**: `#FFA500`
- **Light Background**: `#FAFBFC`
- **Dark Background**: `#0A0E27`

## Features

### Search & Filter
Most list pages include:
- Real-time or submit-based search
- Multiple filter options
- "Clear filters" button
- Export to CSV functionality

### Dark Mode
Toggle dark/light mode from sidebar. Preference stored in localStorage.

### Authentication
All routes require authentication via NextAuth.js v5. Unauthenticated users are redirected to `/auth/signin`.

## API Endpoints

### Transactions
- `GET /api/charges` - List charges
- `GET /api/charges/:id` - Get charge details
- `POST /api/charges/:id/refund` - Issue refund

### Customers
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `GET /api/customers/:id` - Get customer details
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `GET /api/products/:id` - Get product details
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### API Keys
- `GET /api/api-keys` - List API keys
- `POST /api/api-keys` - Create API key
- `DELETE /api/api-keys/:id` - Revoke API key

### Webhooks
- `GET /api/webhooks` - List webhooks
- `POST /api/webhooks` - Create webhook
- `PUT /api/webhooks/:id` - Update webhook
- `DELETE /api/webhooks/:id` - Delete webhook

## Testing

### Jest Tests
```bash
npm test
```

Tests cover:
- Page rendering
- Form submissions
- Filter functionality
- Modal interactions
- API integration

### Manual Testing
1. Create a merchant account at `/auth/signup`
2. Navigate to `/dashboard`
3. Test each page and feature
4. Create test data (products, customers, transactions)
5. Test refund functionality

## Security

### Multi-tenant Isolation
All data queries include `merchantId` to ensure merchants only see their own data.

### API Authentication
API endpoints check session or API key authentication before processing requests.

### PCI Compliance
Card data is tokenized and never stored in full. Only last 4 digits and brand are displayed.

## Browser Compatibility

- Chrome/Chromium (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

## Accessibility

- ARIA labels on all interactive elements
- Keyboard navigation support
- Color contrast ratios meet WCAG AA standards
- Semantic HTML structure

## Performance

- Server-side rendering for initial page load
- Client-side navigation between pages
- Pagination for large data sets
- Lazy loading for charts and images
- Optimized images and CSS

## Roadmap

### Phase 3 (Current)
- ✅ Dashboard overview
- ✅ Transactions page
- ✅ Products page
- ✅ Customers page
- ✅ Settings page

### Phase 4 (Upcoming)
- Payment method management
- Card tokenization
- 3D Secure setup
- Subscription management

### Phase 5 (Future)
- Advanced analytics
- Custom reporting
- Team management
- API documentation portal
