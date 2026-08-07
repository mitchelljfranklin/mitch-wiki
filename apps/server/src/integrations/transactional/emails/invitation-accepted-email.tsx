import { Section, Text } from 'react-email';
import * as React from 'react';
import { content, paragraph } from '../css/styles';
import { MailBody } from '../partials/partials';

interface Props {
  invitedUserName: string;
  invitedUserEmail: string;
  workspaceName?: string;
}

export const InvitationAcceptedEmail = ({
  invitedUserName,
  invitedUserEmail,
  workspaceName,
}: Props) => {
  return (
    <MailBody workspaceName={workspaceName}>
      <Section style={content}>
        <Text style={paragraph}>Hi there,</Text>
        <Text style={paragraph}>
          {invitedUserName} ({invitedUserEmail}) has accepted your invitation,
          and is now a member of the workspace.
        </Text>
      </Section>
    </MailBody>
  );
};

export default InvitationAcceptedEmail;
