const { ApolloClient, InMemoryCache, HttpLink, gql } = require('@apollo/client/core');
const fetch = require('cross-fetch');

const client = new ApolloClient({
  link: new HttpLink({
    uri: 'https://ethio-maids-01.hasura.app/v1/graphql',
    fetch,
    headers: {
      'x-hasura-admin-secret': 'GtTmwvc6ycbRB491SQ7iQnqnMGlg1dHwMCEb0763ogB6Y0ADI0szWUSsbHhmt78F'
    }
  }),
  cache: new InMemoryCache()
});

async function checkUser() {
  // First find the user by email
  const userQuery = gql`
    query GetUserByEmail {
      profiles(where: {email: {_eq: "derartumerga@gmail.com"}}) {
        id
        email
        full_name
        user_type
      }
    }
  `;

  const userResult = await client.query({ query: userQuery });
  console.log('User Profile:', JSON.stringify(userResult.data, null, 2));

  if (userResult.data.profiles.length > 0) {
    const userId = userResult.data.profiles[0].id;

    // Get maid profile with all fields
    const maidQuery = gql`
      query GetMaidProfile($id: String!) {
        maid_profiles_by_pk(id: $id) {
          id
          full_name
          passport_number
          passport_expiry
          verification_status
          profile_photo_url
          introduction_video_url
          nationality
          current_location
          about_me
          skills
          languages
          experience_years
          primary_profession
        }
      }
    `;

    const maidResult = await client.query({
      query: maidQuery,
      variables: { id: userId }
    });
    console.log('\nMaid Profile:', JSON.stringify(maidResult.data, null, 2));

    // Get maid documents
    const docsQuery = gql`
      query GetMaidDocuments($maidId: String!) {
        maid_documents(where: {maid_id: {_eq: $maidId}}) {
          id
          maid_id
          document_type
          document_url
          file_url
          file_path
          status
          created_at
        }
      }
    `;

    const docsResult = await client.query({
      query: docsQuery,
      variables: { maidId: userId }
    });
    console.log('\nMaid Documents:', JSON.stringify(docsResult.data, null, 2));
  }
}

checkUser().catch(console.error);
