import { Section, Text } from 'react-email';
import * as React from 'react';
import { content, paragraph } from '../css/styles';
import { EmailButton, MailBody } from '../partials/partials';

interface Props {
  inviteLink: string;
  workspaceName?: string;
}

export const InvitationEmail = ({ inviteLink, workspaceName }: Props) => {
  const appName = workspaceName ?? "Mitch-Wiki";
  return (
    <MailBody workspaceName={workspaceName}>
      <Section style={content}>
        <Text style={paragraph}>Hi there,</Text>
        <Text style={paragraph}>You have been invited to {appName}.</Text>
        <Text style={paragraph}>
          Please click the button below to accept this invitation.
        </Text>
      </Section>
      <EmailButton href={inviteLink}>Accept Invite</EmailButton>
    </MailBody>
  );
};

export default InvitationEmail;
