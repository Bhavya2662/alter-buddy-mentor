import React, { useState, useEffect } from "react";
import { MainLayout } from "../../../layout";
import {
  useGetAllCategoryQuery,
  useGetAllTemplatePackagesQuery,
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
  Select,
  Input,
  InputGroup,
  InputLeftElement,
} from "@chakra-ui/react";
import { FaSearch, FaVideo, FaVolumeUp, FaComments, FaHeart, FaStar, FaLeaf } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { ISessionPackage } from "../../../interface";

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

export const UserPackagesPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");
  const [selectedSessionType, setSelectedSessionType] = useState<string>("");

  // Fetch user profile to check authentication
  const { data: profile, isLoading: isProfileLoading } = useProfileUserQuery();
  
  // Fetch categories
  const {
    data: categoriesData,
    isLoading: isCategoriesLoading,
    error: categoriesError,
  } = useGetAllCategoryQuery();

  // Fetch all template packages available for purchase
  const {
    data: packagesData,
    isLoading: isPackagesLoading,
    error: packagesError,
  } = useGetAllTemplatePackagesQuery({
    categoryId: selectedCategory || undefined,
    type: selectedSessionType || undefined,
  });

  useEffect(() => {
    if (!isProfileLoading && !profile?.data) {
      toast({
        title: "Authentication Required",
        description: "Please login to view packages",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      navigate("/sign-in");
    }
  }, [profile, isProfileLoading, navigate, toast]);

  // Filter packages based on search text (server-side filtering handles category and type)
  const filteredPackages = packagesData?.data?.filter((pkg: ISessionPackage) => {
    if (!searchText) return true;
    
    // Search in category title, mentor name, or package type
    const category = pkg.categoryId as any;
    const mentor = pkg.mentorId as any;
    const searchLower = searchText.toLowerCase();
    
    return (
      category?.title?.toLowerCase().includes(searchLower) ||
      mentor?.name?.firstName?.toLowerCase().includes(searchLower) ||
      mentor?.name?.lastName?.toLowerCase().includes(searchLower) ||
      pkg.type.toLowerCase().includes(searchLower)
    );
  }) || [];

  const handlePackageSelect = (packageData: ISessionPackage) => {
    // Navigate to package booking/purchase page
    navigate(`/user/package-booking/${packageData._id}`, {
      state: { packageData }
    });
  };

  const getCategoryIcon = (categoryTitle: string) => {
    return categoryIcons[categoryTitle as keyof typeof categoryIcons] || categoryIcons.default;
  };

  if (isProfileLoading || isCategoriesLoading) {
    return (
      <MainLayout loading={true}>
        <Center h="50vh">
          <Spinner size="xl" color="primary.500" />
        </Center>
      </MainLayout>
    );
  }

  return (
    <MainLayout loading={false}>
      <Box className="p-6 mt-20">
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Box textAlign="center">
            <Heading size="xl" color="primary.500" mb={2}>
              Choose Your Healing Package
            </Heading>
            <Text fontSize="lg" color="gray.600">
              Select from our curated packages designed for your spiritual and emotional growth
            </Text>
          </Box>

          {/* Filters */}
          <Card>
            <CardBody>
              <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4}>
                {/* Category Filter */}
                <Box>
                  <Text fontWeight="semibold" mb={2}>
                    Category
                  </Text>
                  <Select
                    placeholder="All Categories"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {categoriesData?.data?.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.title}
                      </option>
                    ))}
                  </Select>
                </Box>

                {/* Session Type Filter */}
                <Box>
                  <Text fontWeight="semibold" mb={2}>
                    Session Type
                  </Text>
                  <Select
                    placeholder="All Types"
                    value={selectedSessionType}
                    onChange={(e) => setSelectedSessionType(e.target.value)}
                  >
                    <option value="video">Video</option>
                    <option value="audio">Audio</option>
                    <option value="chat">Chat</option>
                  </Select>
                </Box>

                {/* Search */}
                <Box>
                  <Text fontWeight="semibold" mb={2}>
                    Search
                  </Text>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <Icon as={FaSearch} color="gray.300" />
                    </InputLeftElement>
                    <Input
                      placeholder="Search packages..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                    />
                  </InputGroup>
                </Box>
              </Grid>
            </CardBody>
          </Card>

          {/* Package Grid */}
          {isPackagesLoading ? (
            <Center h="40vh">
              <Spinner size="xl" color="primary.500" />
            </Center>
          ) : filteredPackages.length === 0 ? (
            <Center h="40vh">
              <VStack>
                <Text fontSize="xl" color="gray.500">
                  No packages found
                </Text>
                <Text color="gray.400">
                  Try adjusting your filters or search terms
                </Text>
              </VStack>
            </Center>
          ) : (
            <Grid
              templateColumns={{
                base: "1fr",
                md: "repeat(2, 1fr)",
                lg: "repeat(3, 1fr)",
              }}
              gap={6}
            >
              {filteredPackages.map((pkg: ISessionPackage) => {
                const category = pkg.categoryId as any;
                const mentor = pkg.mentorId as any;
                const categoryTitle = category?.title || 'Unknown';
                const mentorName = mentor?.name ? `${mentor.name.firstName || ''} ${mentor.name.lastName || ''}`.trim() : 'Unknown Mentor';
                const CategoryIcon = getCategoryIcon(categoryTitle);
                const SessionIcon = sessionTypeIcons[pkg.type as keyof typeof sessionTypeIcons];
                const sessionColor = sessionTypeColors[pkg.type as keyof typeof sessionTypeColors];

                return (
                  <Card
                    key={pkg._id}
                    cursor="pointer"
                    transition="all 0.3s"
                    _hover={{
                      transform: "translateY(-4px)",
                      shadow: "xl",
                      borderColor: "primary.500",
                    }}
                    border="2px"
                    borderColor="gray.200"
                    onClick={() => handlePackageSelect(pkg)}
                  >
                    <CardHeader pb={2}>
                      <HStack justify="space-between" align="start">
                        <HStack>
                          <Icon as={CategoryIcon} color="primary.500" boxSize={5} />
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="bold" fontSize="lg">
                              {categoryTitle}
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                              by {mentorName}
                            </Text>
                            <HStack>
                              <Icon as={SessionIcon} color={`${sessionColor}.500`} boxSize={4} />
                              <Badge colorScheme={sessionColor} textTransform="capitalize">
                                {pkg.type}
                              </Badge>
                            </HStack>
                          </VStack>
                        </HStack>
                        <Text fontSize="2xl" fontWeight="bold" color="primary.500">
                          ₹{pkg.price}
                        </Text>
                      </HStack>
                    </CardHeader>

                    <CardBody pt={0}>
                      <VStack align="stretch" spacing={3}>
                        <HStack justify="space-between">
                          <Text color="gray.600">
                            <strong>Total Sessions:</strong> {pkg.totalSessions}
                          </Text>
                          <Text color="gray.600">
                            <strong>Duration:</strong> {pkg.duration || 60} min
                          </Text>
                        </HStack>

                        {pkg.duration && (
                          <Text color="gray.600">
                            <strong>Duration:</strong> {pkg.duration} minutes per session
                          </Text>
                        )}

                        <Badge
                          colorScheme="green"
                          alignSelf="start"
                        >
                          Available for Purchase
                        </Badge>

                        <Button
                          colorScheme="primary"
                          size="md"
                          width="full"
                          mt={2}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePackageSelect(pkg);
                          }}
                        >
                          Purchase Package
                        </Button>
                      </VStack>
                    </CardBody>
                  </Card>
                );
              })}
            </Grid>
          )}
        </VStack>
      </Box>
    </MainLayout>
  );
};