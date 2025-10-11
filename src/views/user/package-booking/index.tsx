import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { MainLayout } from "../../../layout";
import {
  useGetAllCategoryQuery,
  useGetMentorByCategoryQuery,
  useProfileUserQuery,
} from "../../../redux/rtk-api";
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Grid,
  Heading,
  Text,
  Badge,
  VStack,
  HStack,
  Icon,
  useToast,
  Spinner,
  Center,
  Avatar,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Checkbox,
  CheckboxGroup,
  Stack,
  RadioGroup,
  Radio,
} from "@chakra-ui/react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import moment from "moment";
import { FaVideo, FaVolumeUp, FaComments, FaHeart, FaStar, FaLeaf, FaCalendarAlt, FaClock } from "react-icons/fa";
import { ISessionPackage } from "../../../interface";

// Custom CSS for calendar styling
const calendarStyles = `
  .react-calendar {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-family: inherit;
  }
  .react-calendar__tile {
    border-radius: 4px;
  }
  .react-calendar__tile--active {
    background: #3182ce !important;
    color: white;
  }
  .react-calendar__tile:hover {
    background: #e2e8f0;
  }
`;

const categoryIcons = {
  "Inner child healing": FaHeart,
  "Reiki": FaLeaf,
  "Energy Work": FaStar,
  "Healing": FaHeart,
  "Mental Health": FaStar,
  "Manifestation": FaStar,
  "default": FaStar,
};

const sessionTypeIcons = {
  video: FaVideo,
  audio: FaVolumeUp,
  chat: FaComments,
};

const sessionTypeColors = {
  video: "blue",
  audio: "green",
  chat: "purple",
};

export const PackageBookingPage = () => {
  const { packageId } = useParams<{ packageId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [selectedMentor, setSelectedMentor] = useState<any>(null);
  const [bookingType, setBookingType] = useState<'individual' | 'all_slots'>('individual');
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectAllSlots, setSelectAllSlots] = useState(false);

  // Get package data from location state
  const packageData: ISessionPackage = location.state?.packageData;

  // Fetch user profile
  const { data: profile, isLoading: isProfileLoading } = useProfileUserQuery();
  
  // Fetch categories
  const { data: categoriesData } = useGetAllCategoryQuery();

  // Fetch mentors for this package category
  const {
    data: mentorsData,
    isLoading: isMentorsLoading,
    error: mentorsError,
  } = useGetMentorByCategoryQuery(packageData?.categoryId || "", {
    skip: !packageData?.categoryId,
  });

  useEffect(() => {
    if (!isProfileLoading && !profile?.data) {
      toast({
        title: "Authentication Required",
        description: "Please login to book packages",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      navigate("/sign-in");
    }
  }, [profile, isProfileLoading, navigate, toast]);

  useEffect(() => {
    if (!packageData && packageId) {
      // If no package data in state, redirect back to packages page
      navigate("/user/packages");
    }
  }, [packageData, packageId, navigate]);

  const handleMentorSelect = (mentor: any) => {
    setSelectedMentor(mentor);
    // Reset slot selection when mentor changes
    setSelectedSlots([]);
    setSelectAllSlots(false);
    onOpen();
  };

  const handleSlotToggle = (slotId: string) => {
    setSelectedSlots(prev => {
      const newSlots = prev.includes(slotId)
        ? prev.filter(id => id !== slotId)
        : [...prev, slotId];
      
      // Update select all checkbox state
      setSelectAllSlots(newSlots.length === availableSlots.length && availableSlots.length > 0);
      return newSlots;
    });
  };

  const handleSelectAllSlots = () => {
    if (selectAllSlots) {
      setSelectedSlots([]);
      setSelectAllSlots(false);
    } else {
      const allSlotIds = availableSlots.map(slot => slot._id);
      setSelectedSlots(allSlotIds);
      setSelectAllSlots(true);
    }
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    // Reset slot selection when date changes
    setSelectedSlots([]);
    setSelectAllSlots(false);
    
    // Fetch available slots for the selected date and mentor
    if (selectedMentor) {
      fetchAvailableSlots(selectedMentor._id, date);
    }
  };

  // Mock function to simulate fetching available slots
  const fetchAvailableSlots = (mentorId: string, date: Date) => {
    // This is a mock implementation - replace with actual API call
    const mockSlots = [
      { _id: '1', time: '09:00 AM', available: true },
      { _id: '2', time: '10:00 AM', available: true },
      { _id: '3', time: '11:00 AM', available: true },
      { _id: '4', time: '02:00 PM', available: true },
      { _id: '5', time: '03:00 PM', available: true },
      { _id: '6', time: '04:00 PM', available: true },
    ];
    
    // Simulate API delay
    setTimeout(() => {
      setAvailableSlots(mockSlots);
    }, 500);
  };

  // Fetch slots when mentor is selected
  useEffect(() => {
    if (selectedMentor && bookingType === 'all_slots') {
      fetchAvailableSlots(selectedMentor._id, selectedDate);
    }
  }, [selectedMentor, bookingType]);

  const handleBookingConfirm = async () => {
    if (!selectedMentor || !packageData) return;

    // Validate slot selection for bulk booking
    if (bookingType === 'all_slots' && selectedSlots.length === 0) {
      toast({
        title: "Slot Selection Required",
        description: "Please select at least one time slot for bulk booking.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Prepare booking data
      const bookingData = {
        packageData,
        selectedMentor,
        bookingType,
        totalAmount: packageData.price,
        ...(bookingType === 'all_slots' && {
          selectedSlots: selectedSlots.slice(0, packageData.totalSessions),
          selectedDate: moment(selectedDate).format('YYYY-MM-DD'),
        }),
      };

      // Navigate to payment page with booking details
      navigate("/payment", {
        state: bookingData,
      });

      toast({
        title: "Booking Confirmed",
        description: `Successfully prepared booking for ${packageData.totalSessions} sessions${bookingType === 'all_slots' ? ' with selected time slots' : ''}.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Booking confirmation error:", error);
      toast({
        title: "Booking Error",
        description: "Failed to process booking. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
      onClose();
    }
  };

  const getCategoryIcon = (categoryTitle: string) => {
    return categoryIcons[categoryTitle as keyof typeof categoryIcons] || categoryIcons.default;
  };

  if (isProfileLoading || isMentorsLoading) {
    return (
      <MainLayout loading={true}>
        <Center h="50vh">
          <Spinner size="xl" color="primary.500" />
        </Center>
      </MainLayout>
    );
  }

  if (!packageData) {
    return (
      <MainLayout loading={false}>
        <Center h="50vh">
          <Alert status="error">
            <AlertIcon />
            <Box>
              <AlertTitle>Package Not Found!</AlertTitle>
              <AlertDescription>
                The package you're trying to book could not be found.
              </AlertDescription>
            </Box>
          </Alert>
        </Center>
      </MainLayout>
    );
  }

  const category = categoriesData?.data?.find(cat => cat._id === packageData.categoryId);
  const categoryTitle = category?.title || 'Unknown';
  const CategoryIcon = getCategoryIcon(categoryTitle);
  const SessionIcon = sessionTypeIcons[packageData.type as keyof typeof sessionTypeIcons];
  const sessionColor = sessionTypeColors[packageData.type as keyof typeof sessionTypeColors];

  return (
    <MainLayout loading={false}>
      <style>{calendarStyles}</style>
      <Box className="p-6 mt-20">
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Box textAlign="center">
            <Button
              variant="ghost"
              onClick={() => navigate("/user/packages")}
              mb={4}
              alignSelf="start"
            >
              ← Back to Packages
            </Button>
            <Heading size="xl" color="primary.500" mb={2}>
              Book Your Package
            </Heading>
            <Text fontSize="lg" color="gray.600">
              Select a mentor and configure your session preferences
            </Text>
          </Box>

          {/* Package Details */}
          <Card>
            <CardHeader>
              <HStack justify="space-between" align="start">
                <HStack>
                  <Icon as={CategoryIcon} color="primary.500" boxSize={6} />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold" fontSize="xl">
                      {categoryTitle}
                    </Text>
                    <HStack>
                      <Icon as={SessionIcon} color={`${sessionColor}.500`} boxSize={4} />
                      <Badge colorScheme={sessionColor} textTransform="capitalize">
                        {packageData.type}
                      </Badge>
                    </HStack>
                  </VStack>
                </HStack>
                <Text fontSize="3xl" fontWeight="bold" color="primary.500">
                  ₹{packageData.price}
                </Text>
              </HStack>
            </CardHeader>

            <CardBody>
              <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4}>
                <VStack align="start">
                  <Text fontWeight="semibold">Total Sessions</Text>
                  <Text fontSize="2xl" color="primary.500">
                    {packageData.totalSessions}
                  </Text>
                </VStack>
                <VStack align="start">
                  <Text fontWeight="semibold">Remaining Sessions</Text>
                  <Text fontSize="2xl" color="green.500">
                    {packageData.remainingSessions}
                  </Text>
                </VStack>
                {packageData.duration && (
                  <VStack align="start">
                    <Text fontWeight="semibold">Duration per Session</Text>
                    <Text fontSize="2xl" color="blue.500">
                      {packageData.duration} min
                    </Text>
                  </VStack>
                )}
              </Grid>
            </CardBody>
          </Card>

          {/* Booking Options */}
          <Card>
            <CardHeader>
              <Heading size="md">Booking Preferences</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Text fontWeight="semibold" mb={2}>
                    How would you like to schedule your sessions?
                  </Text>
                  <Stack direction="row" spacing={4}>
                    <Button
                      variant={bookingType === 'individual' ? 'solid' : 'outline'}
                      colorScheme="primary"
                      onClick={() => setBookingType('individual')}
                    >
                      <Icon as={FaCalendarAlt} mr={2} />
                      Schedule Individual Sessions
                    </Button>
                    <Button
                      variant={bookingType === 'all_slots' ? 'solid' : 'outline'}
                      colorScheme="primary"
                      onClick={() => setBookingType('all_slots')}
                    >
                      <Icon as={FaClock} mr={2} />
                      Book All Sessions at Once
                    </Button>
                  </Stack>
                </Box>

                {bookingType === 'individual' && (
                  <Alert status="info">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Individual Scheduling</AlertTitle>
                      <AlertDescription>
                        You'll be able to schedule each session individually after discussing with your mentor.
                        This gives you flexibility to plan sessions based on your availability and progress.
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}

                {bookingType === 'all_slots' && (
                  <Alert status="info">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Bulk Scheduling</AlertTitle>
                      <AlertDescription>
                        All sessions will be scheduled at once based on your mentor's available slots.
                        This ensures consistent scheduling but offers less flexibility.
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* Available Mentors */}
          <Card>
            <CardHeader>
              <Heading size="md">Select Your Mentor</Heading>
            </CardHeader>
            <CardBody>
              {mentorsError ? (
                <Alert status="error">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Error Loading Mentors</AlertTitle>
                    <AlertDescription>
                      There was an error loading available mentors. Please try again later.
                    </AlertDescription>
                  </Box>
                </Alert>
              ) : mentorsData?.data?.length === 0 ? (
                <Alert status="warning">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>No Mentors Available</AlertTitle>
                    <AlertDescription>
                      Currently, no mentors are available for this category. Please check back later.
                    </AlertDescription>
                  </Box>
                </Alert>
              ) : (
                <Grid
                  templateColumns={{
                    base: "1fr",
                    md: "repeat(2, 1fr)",
                    lg: "repeat(3, 1fr)",
                  }}
                  gap={4}
                >
                  {mentorsData?.data?.map((mentor: any) => (
                    <Card
                      key={mentor._id}
                      cursor="pointer"
                      transition="all 0.3s"
                      _hover={{
                        transform: "translateY(-2px)",
                        shadow: "lg",
                        borderColor: "primary.500",
                      }}
                      border="2px"
                      borderColor="gray.200"
                      onClick={() => handleMentorSelect(mentor)}
                    >
                      <CardBody>
                        <VStack spacing={3}>
                          <Avatar
                            size="lg"
                            name={mentor.name}
                            src={mentor.profileImage}
                          />
                          <VStack spacing={1}>
                            <Text fontWeight="bold" fontSize="lg">
                              {mentor.name}
                            </Text>
                            <Text color="gray.600" textAlign="center">
                              {mentor.bio || 'Experienced mentor'}
                            </Text>
                            {mentor.rating && (
                              <HStack>
                                <Icon as={FaStar} color="yellow.400" />
                                <Text>{mentor.rating}/5</Text>
                              </HStack>
                            )}
                          </VStack>
                          <Button
                            colorScheme="primary"
                            size="sm"
                            width="full"
                          >
                            Select Mentor
                          </Button>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </Grid>
              )}
            </CardBody>
          </Card>
        </VStack>
      </Box>

      {/* Booking Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="6xl">
        <ModalOverlay />
        <ModalContent maxH="90vh" overflowY="auto">
          <ModalHeader>Confirm Booking & Select Slots</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={6} align="stretch">
              <Grid templateColumns="1fr 1fr" gap={6}>
                <Box>
                  <Text fontWeight="bold" mb={2}>Package Details:</Text>
                  <VStack align="start" spacing={2}>
                    <Text><strong>Category:</strong> {categoryTitle}</Text>
                    <Text><strong>Type:</strong> {packageData.type}</Text>
                    <Text><strong>Sessions:</strong> {packageData.totalSessions}</Text>
                    <Text><strong>Price:</strong> <Text as="span" fontSize="xl" color="green.500">₹{packageData.price}</Text></Text>
                  </VStack>
                </Box>
                <Box>
                  <Text fontWeight="bold" mb={2}>Selected Mentor:</Text>
                  <HStack>
                    <Avatar size="md" name={selectedMentor?.name} src={selectedMentor?.profileImage} />
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="semibold">
                        {selectedMentor?.name}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        {selectedMentor?.bio || 'Experienced mentor'}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              </Grid>

              <Divider />

              <Box>
                <Text fontWeight="bold" mb={4}>Booking Preference:</Text>
                <Stack direction="column" spacing={3}>
                  <Button
                    variant={bookingType === 'individual' ? 'solid' : 'outline'}
                    colorScheme="primary"
                    onClick={() => setBookingType('individual')}
                    justifyContent="start"
                    p={4}
                    h="auto"
                  >
                    <VStack align="start" spacing={1}>
                      <Text>Schedule sessions individually</Text>
                      <Text fontSize="sm" color="gray.600">Discuss and schedule each session with your mentor</Text>
                    </VStack>
                  </Button>
                  <Button
                    variant={bookingType === 'all_slots' ? 'solid' : 'outline'}
                    colorScheme="primary"
                    onClick={() => setBookingType('all_slots')}
                    justifyContent="start"
                    p={4}
                    h="auto"
                  >
                    <VStack align="start" spacing={1}>
                      <Text>Select all time slots at once</Text>
                      <Text fontSize="sm" color="gray.600">Choose all {packageData.totalSessions} slots now from available times</Text>
                    </VStack>
                  </Button>
                </Stack>
              </Box>

              {bookingType === "all_slots" && (
                <>
                  <Divider />
                  <Box>
                    <Text fontWeight="bold" mb={4}>Select Time Slots ({selectedSlots.length}/{packageData.totalSessions} selected)</Text>
                    
                    <Grid templateColumns="1fr 1fr" gap={6}>
                      <Box>
                        <Text fontWeight="semibold" mb={3}>Choose Date:</Text>
                        <Calendar
                          onChange={handleDateChange}
                          value={selectedDate}
                          minDate={new Date()}
                          className="w-full"
                        />
                      </Box>
                      
                      <Box>
                        <Text fontWeight="semibold" mb={3}>
                          Available Slots for {moment(selectedDate).format("MMMM DD, YYYY")}
                        </Text>
                        
                        {availableSlots.length > 0 && (
                          <Checkbox
                            isChecked={selectAllSlots}
                            onChange={handleSelectAllSlots}
                            mb={3}
                            colorScheme="primary"
                          >
                            Select All Available Slots
                          </Checkbox>
                        )}
                        
                        <VStack align="stretch" spacing={2} maxH="300px" overflowY="auto">
                          {availableSlots.length > 0 ? (
                            availableSlots.map((slot) => (
                              <Checkbox
                                key={slot._id}
                                isChecked={selectedSlots.includes(slot._id)}
                                onChange={() => handleSlotToggle(slot._id)}
                                colorScheme="primary"
                                p={2}
                                borderRadius="md"
                                _hover={{ bg: "gray.50" }}
                              >
                                <HStack justify="space-between" w="full">
                                  <Text>{slot.time}</Text>
                                  <Badge colorScheme="green" size="sm">
                                    Available
                                  </Badge>
                                </HStack>
                              </Checkbox>
                            ))
                          ) : (
                            <Text color="gray.500" textAlign="center" py={4}>
                              No available slots for this date.
                              Please select a different date.
                            </Text>
                          )}
                        </VStack>
                        
                        {selectedSlots.length > packageData.totalSessions && (
                          <Alert status="warning" mt={3}>
                            <AlertIcon />
                            <AlertDescription>
                              You've selected more slots than required. Only {packageData.totalSessions} slots will be booked.
                            </AlertDescription>
                          </Alert>
                        )}
                      </Box>
                    </Grid>
                  </Box>
                </>
              )}

              <Alert status="info">
                <AlertIcon />
                <Box>
                  <AlertTitle>Payment Required</AlertTitle>
                  <AlertDescription>
                    You will be redirected to the payment page to complete your booking.
                  </AlertDescription>
                </Box>
              </Alert>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="primary"
              onClick={handleBookingConfirm}
              isLoading={isProcessing}
              loadingText="Processing..."
              isDisabled={bookingType === "all_slots" && selectedSlots.length === 0}
            >
              Proceed to Payment
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </MainLayout>
  );
};