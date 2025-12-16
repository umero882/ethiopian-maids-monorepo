import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AgencyGraphQLTest = () => {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Agency GraphQL Test</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Agency service is now using GraphQL/Hasura.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgencyGraphQLTest;
