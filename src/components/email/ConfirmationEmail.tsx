import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Input,
  FormControl,
  FormLabel,
  FormErrorMessage,
  VStack,
  Text,
  Box,
  useToast
} from '@chakra-ui/react';
import { EmailIcon } from '@chakra-ui/icons';
import { apiClient } from '../../utils/axios.utils';

interface ConfirmationEmailProps {
  visible: boolean;
  onClose: () => void;
  sessionDetails: {
    id: string;
    startTime: string;
    endTime: string;
    mentorName: string;
    callType: string;
    joinUrl?: string;
  };
  recipientEmail: string;
}

const ConfirmationEmail: React.FC<ConfirmationEmailProps> = ({
  visible,
  onClose,
  sessionDetails,
  recipientEmail
}) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(recipientEmail);
  const [emailError, setEmailError] = useState('');
  const toast = useToast();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendEmail = async () => {
    if (!email) {
      setEmailError('Please enter recipient email');
      return;
    }
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email');
      return;
    }
    setEmailError('');

    try {
      setLoading(true);
      
      const emailData = {
        to: email,
        subject: `Your Session with ${sessionDetails.mentorName} is Confirmed`,
        sessionDetails: {
          id: sessionDetails.id,
          startTime: sessionDetails.startTime,
          endTime: sessionDetails.endTime,
          mentorName: sessionDetails.mentorName,
          callType: sessionDetails.callType,
          joinUrl: sessionDetails.joinUrl || ''
        }
      };

      await apiClient.post('/api/v1/email/send-confirmation', emailData);
      
      toast({
        title: 'Success',
        description: 'Confirmation email sent successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      toast({
        title: 'Error',
        description: 'Failed to send confirmation email. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (visible && recipientEmail) {
      setEmail(recipientEmail);
    }
  }, [visible, recipientEmail]);

  return (
    <Modal isOpen={visible} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Send Session Confirmation Email</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isInvalid={!!emailError}>
              <FormLabel>Recipient Email</FormLabel>
              <Input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError('');
                }}
              />
              <FormErrorMessage>{emailError}</FormErrorMessage>
            </FormControl>

            <Box className="session-details-preview" w="100%">
              <Text fontSize="lg" fontWeight="bold" mb={2}>Session Details</Text>
              <Text><strong>Mentor:</strong> {sessionDetails.mentorName}</Text>
              <Text><strong>Session Type:</strong> {sessionDetails.callType}</Text>
              <Text><strong>Start Time:</strong> {new Date(sessionDetails.startTime).toLocaleString()}</Text>
              <Text><strong>End Time:</strong> {new Date(sessionDetails.endTime).toLocaleString()}</Text>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            leftIcon={<EmailIcon />}
            isLoading={loading}
            onClick={handleSendEmail}
          >
            Send Confirmation
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ConfirmationEmail;