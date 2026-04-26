import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Inbox } from 'lucide-react';

export function EmptyState({ icon: Icon = Inbox, title = 'Sin resultados', description, action }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <Icon className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium mb-1">{title}</h3>
        {description && <p className="text-sm text-muted-foreground mb-4 max-w-sm">{description}</p>}
        {action}
      </CardContent>
    </Card>
  );
}
