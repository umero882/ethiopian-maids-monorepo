/**
 * Check support_tickets table and add sample data if empty
 */

const HASURA_ENDPOINT = 'https://ethio-maids-01.hasura.app/v1/graphql';
const HASURA_ADMIN_SECRET = process.env.HASURA_ADMIN_SECRET || 'GtTmwvc6ycbRB491SQ7iQnqnMGlg1dHwMCEb0763ogB6Y0ADI0szWUSsbHhmt78F';

async function executeGraphQL(query, variables = {}) {
  const response = await fetch(HASURA_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': HASURA_ADMIN_SECRET
    },
    body: JSON.stringify({ query, variables })
  });
  return response.json();
}

async function checkSupportData() {
  console.log('Checking support_tickets table...\n');

  // Check existing tickets
  const checkQuery = `
    query CheckSupportData {
      support_tickets(limit: 10, order_by: { created_at: desc }) {
        id
        subject
        user_name
        user_type
        category
        priority
        status
        created_at
      }
      support_tickets_aggregate {
        aggregate {
          count
        }
      }
    }
  `;

  const result = await executeGraphQL(checkQuery);

  if (result.errors) {
    console.error('Error:', result.errors[0].message);
    return;
  }

  const count = result.data?.support_tickets_aggregate?.aggregate?.count || 0;
  console.log(`Total support tickets: ${count}\n`);

  if (count > 0) {
    console.log('Existing tickets:');
    result.data.support_tickets.forEach((ticket, i) => {
      console.log(`${i + 1}. ${ticket.subject || 'No subject'} - ${ticket.user_name} (${ticket.user_type}) - ${ticket.status} - ${ticket.priority}`);
    });
    return;
  }

  console.log('No tickets found. Creating sample data...\n');

  // Get some real user IDs
  const usersQuery = `
    query GetSampleUsers {
      sponsor_profiles(limit: 2) {
        id
        full_name
      }
      maid_profiles(limit: 2) {
        id
        full_name
      }
      agency_profiles(limit: 1) {
        id
        full_name
      }
      profiles(limit: 5) {
        id
        email
        full_name
        user_type
      }
    }
  `;

  const usersResult = await executeGraphQL(usersQuery);

  if (usersResult.errors) {
    console.error('Error getting users:', usersResult.errors[0].message);
    return;
  }

  const profiles = usersResult.data?.profiles || [];
  console.log('Found profiles:', profiles.length);
  profiles.forEach(p => console.log(`  - ${p.full_name || 'Unknown'} (${p.user_type || 'unknown'}) - ${p.id.substring(0, 8)}...`));

  // Create sample support tickets
  const sampleTickets = [
    {
      user_id: profiles[0]?.id || null,
      user_name: profiles[0]?.full_name || 'Ahmed Hassan',
      user_type: profiles[0]?.user_type || 'sponsor',
      user_email: profiles[0]?.email || 'ahmed.hassan@example.com',
      subject: 'Payment not processed',
      message: 'Customer payment was deducted from account but booking was not confirmed. Transaction ID: TXN-2024-1214-001',
      category: 'payment_issues',
      priority: 'high',
      status: 'open',
      tags: ['urgent', 'payment', 'bug']
    },
    {
      user_id: profiles[1]?.id || null,
      user_name: profiles[1]?.full_name || 'Fatima Ahmed',
      user_type: profiles[1]?.user_type || 'maid',
      user_email: profiles[1]?.email || 'fatima.ahmed@example.com',
      subject: 'Profile verification issue',
      message: 'Unable to complete profile verification. Documents uploaded but status still showing as pending.',
      category: 'account_issues',
      priority: 'medium',
      status: 'in_progress',
      assigned_agent_name: 'Admin Support',
      tags: ['verification', 'documents', 'maid']
    },
    {
      user_id: profiles[2]?.id || null,
      user_name: profiles[2]?.full_name || 'Sarah Johnson',
      user_type: profiles[2]?.user_type || 'sponsor',
      user_email: profiles[2]?.email || 'sarah.johnson@example.com',
      subject: 'Booking cancellation refund',
      message: 'Customer wants to cancel booking and get full refund due to maid unavailability.',
      category: 'booking_issues',
      priority: 'medium',
      status: 'resolved',
      assigned_agent_name: 'Sarah Wilson',
      satisfaction_rating: 5,
      resolved_at: new Date().toISOString(),
      tags: ['refund', 'cancellation', 'booking']
    },
    {
      user_id: profiles[3]?.id || null,
      user_name: profiles[3]?.full_name || 'EthioMaid Services Ltd.',
      user_type: profiles[3]?.user_type || 'agency',
      user_email: profiles[3]?.email || 'finance@ethiomaidservices.com',
      subject: 'Agency commission calculation error',
      message: 'Commission calculation seems incorrect for December. Expected amount is higher than what was calculated.',
      category: 'financial_issues',
      priority: 'high',
      status: 'escalated',
      assigned_agent_name: 'David Kim',
      tags: ['commission', 'calculation', 'financial', 'escalated']
    },
    {
      user_id: profiles[4]?.id || null,
      user_name: profiles[4]?.full_name || 'Emma Wilson',
      user_type: profiles[4]?.user_type || 'sponsor',
      user_email: profiles[4]?.email || 'emma.wilson@example.com',
      subject: 'Password reset not working',
      message: 'Password reset email not being received. Tried multiple times but no email arrives.',
      category: 'technical_issues',
      priority: 'low',
      status: 'closed',
      assigned_agent_name: 'Michael Brown',
      satisfaction_rating: 4,
      resolved_at: new Date(Date.now() - 86400000).toISOString(),
      closed_at: new Date().toISOString(),
      tags: ['password', 'email', 'login']
    }
  ];

  const insertMutation = `
    mutation InsertSupportTickets($objects: [support_tickets_insert_input!]!) {
      insert_support_tickets(objects: $objects) {
        affected_rows
        returning {
          id
          subject
          user_name
          status
        }
      }
    }
  `;

  const insertResult = await executeGraphQL(insertMutation, { objects: sampleTickets });

  if (insertResult.errors) {
    console.error('Error inserting tickets:', insertResult.errors[0].message);
    return;
  }

  console.log(`Created ${insertResult.data?.insert_support_tickets?.affected_rows} tickets:\n`);
  insertResult.data?.insert_support_tickets?.returning.forEach((ticket, i) => {
    console.log(`${i + 1}. ${ticket.subject} - ${ticket.user_name} - ${ticket.status}`);
  });

  // Now add some sample messages for the first few tickets
  const ticketIds = insertResult.data?.insert_support_tickets?.returning.map(t => t.id) || [];

  if (ticketIds.length > 0) {
    const sampleMessages = [
      {
        ticket_id: ticketIds[0],
        sender_id: profiles[0]?.id || null,
        sender_name: profiles[0]?.full_name || 'Ahmed Hassan',
        sender_type: 'customer',
        message: 'My payment was deducted but booking not confirmed. Please help urgently.'
      },
      {
        ticket_id: ticketIds[0],
        sender_name: 'Admin Support',
        sender_type: 'agent',
        message: 'Hi Ahmed, I understand your concern. Let me check the transaction details and get back to you shortly.'
      },
      {
        ticket_id: ticketIds[1],
        sender_id: profiles[1]?.id || null,
        sender_name: profiles[1]?.full_name || 'Fatima Ahmed',
        sender_type: 'customer',
        message: 'I uploaded all required documents 3 days ago but verification status is still pending.'
      },
      {
        ticket_id: ticketIds[1],
        sender_name: 'Admin Support',
        sender_type: 'agent',
        message: 'Hi Fatima, thank you for contacting us. I will review your documents and update the verification status within 24 hours.'
      },
      {
        ticket_id: ticketIds[2],
        sender_id: profiles[2]?.id || null,
        sender_name: profiles[2]?.full_name || 'Sarah Johnson',
        sender_type: 'customer',
        message: 'The maid I booked is no longer available. I need to cancel and get a refund.'
      },
      {
        ticket_id: ticketIds[2],
        sender_name: 'Sarah Wilson',
        sender_type: 'agent',
        message: 'I understand your situation. I will process the full refund immediately. You should see the amount in your account within 3-5 business days.'
      }
    ];

    const insertMessagesMutation = `
      mutation InsertSupportMessages($objects: [support_messages_insert_input!]!) {
        insert_support_messages(objects: $objects) {
          affected_rows
        }
      }
    `;

    const messagesResult = await executeGraphQL(insertMessagesMutation, { objects: sampleMessages });

    if (messagesResult.errors) {
      console.error('Error inserting messages:', messagesResult.errors[0].message);
    } else {
      console.log(`\nCreated ${messagesResult.data?.insert_support_messages?.affected_rows} support messages`);
    }
  }

  console.log('\nSupport data setup complete!');
}

checkSupportData().catch(console.error);
