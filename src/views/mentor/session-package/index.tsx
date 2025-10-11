import React, { useState } from "react";
import { MentorLayout } from "../../../layout";
import {
  AiOutlineLoading,
  AiOutlineEdit,
  AiOutlineDelete,
} from "react-icons/ai";
import { FaUsers, FaMoneyBillWave, FaChartLine } from "react-icons/fa";
import moment from "moment";
import {
  useGetMentorSessionPackagesQuery,
  useCreateMentorSessionPackageMutation,
  useUpdateMentorSessionPackageMutation,
  useDeleteMentorSessionPackageMutation,
  useMentorProfileQuery,
  useMentorGetMyCallsQuery,
} from "../../../redux/rtk-api";
import {
  Button,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Select,
  Spinner,
  useToast,
  Box,
  Text,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Progress,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from "@chakra-ui/react";
import { AppButton } from "../../../component";

export const MentorSessionPackagePage = () => {
  const toast = useToast();
  const { data: profileData, isLoading: isProfileLoading } = useMentorProfileQuery();
  const mentorId = profileData?.data?._id;

  const {
    data: packageData,
    isLoading: isLoadingPackages,
    refetch,
  } = useGetMentorSessionPackagesQuery(mentorId);

  const {
    data: callsData,
    isLoading: isCallsLoading,
  } = useMentorGetMyCallsQuery();

  const [createPackage] = useCreateMentorSessionPackageMutation();
  const [updatePackage] = useUpdateMentorSessionPackageMutation();
  const [deletePackage] = useDeleteMentorSessionPackageMutation();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [isEdit, setIsEdit] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [packageToDelete, setPackageToDelete] = useState(null);
  const [searchText, setSearchText] = useState("");

  // Calculate package statistics
  const packageStats = React.useMemo(() => {
    if (!packageData?.data) return { totalPackages: 0, totalRevenue: 0, totalSessions: 0, usedSessions: 0 };
    
    const packages = packageData.data;
    const totalPackages = packages.length;
    const totalRevenue = packages.reduce((sum, pkg) => sum + (pkg.price * (pkg.totalSessions - pkg.remainingSessions)), 0);
    const totalSessions = packages.reduce((sum, pkg) => sum + pkg.totalSessions, 0);
    const usedSessions = packages.reduce((sum, pkg) => sum + (pkg.totalSessions - pkg.remainingSessions), 0);
    
    return { totalPackages, totalRevenue, totalSessions, usedSessions };
  }, [packageData]);

  // Filter packages based on search
  const filteredPackages = React.useMemo(() => {
    if (!packageData?.data) return [];
    if (!searchText) return packageData.data;
    
    return packageData.data.filter(pkg => 
      pkg.type.toLowerCase().includes(searchText.toLowerCase()) ||
      (pkg.categoryId as any)?.title?.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [packageData, searchText]);

  const [form, setForm] = useState({
    type: "", // Changed from sessionType to match backend
    price: "",
    packagePrice: "",
    totalSessions: "", // Changed from totalSession to match backend
    categoryId: "",
    duration: "",
    remarks: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async () => {
    // Validation
    if (!form.type || !form.price || !form.totalSessions || !form.categoryId) {
      toast({ 
        title: "Validation Error", 
        description: "Please fill in all required fields: Session Type, Price, Total Sessions, and Category",
        status: "error" 
      });
      return;
    }

    if (Number(form.price) <= 0) {
      toast({ 
        title: "Validation Error", 
        description: "Price must be greater than 0",
        status: "error" 
      });
      return;
    }

    if (Number(form.totalSessions) <= 0) {
      toast({ 
        title: "Validation Error", 
        description: "Total sessions must be greater than 0",
        status: "error" 
      });
      return;
    }

    try {
      const payload = {
        mentorId,
        type: form.type as "chat" | "audio" | "video", // Changed from sessionType
        price: Number(form.price),
        totalSessions: Number(form.totalSessions), // Changed from totalSession
        remainingSessions: Number(form.totalSessions), // Set initial remaining sessions
        duration: form.duration ? Number(form.duration) : undefined,
        categoryId: form.categoryId,
        remarks: form.remarks,
      };

      if (isEdit) {
        await updatePackage({ id: editingId, body: payload });
        toast({ title: "Package updated", status: "success" });
      } else {
        await createPackage(payload);
        toast({ title: "Package created", status: "success" });
      }

      onClose();
      setIsEdit(false);
      setForm({ type: "", price: "", packagePrice: "", totalSessions: "", categoryId: "", duration: "", remarks: "" });
      refetch();
    } catch (error) {
      console.error("Failed to submit package", error);
      toast({ 
        title: "Error", 
        description: "Failed to save package. Please try again.",
        status: "error" 
      });
    }
  };

  const handleEdit = (pkg) => {
    setForm({
      type: pkg.type || pkg.sessionType, // Support both field names for backward compatibility
      price: pkg.price,
      packagePrice: pkg.packagePrice,
      totalSessions: pkg.totalSessions || pkg.totalSession, // Support both field names
      categoryId: pkg.categoryId,
      duration: pkg.duration || "",
      remarks: pkg.remarks || "",
    });
    setEditingId(pkg._id);
    setIsEdit(true);
    onOpen();
  };

  const handleDelete = (pkg) => {
    setPackageToDelete(pkg);
    onDeleteOpen();
  };

  const confirmDelete = async () => {
    if (packageToDelete) {
      try {
        await deletePackage(packageToDelete._id);
        toast({ title: "Package deleted successfully", status: "success" });
        refetch();
        onDeleteClose();
        setPackageToDelete(null);
      } catch (error) {
        toast({ title: "Failed to delete package", status: "error" });
      }
    }
  };

  return (
    <MentorLayout>
      <div>
        <div className="flex items-center justify-between py-3">
          <h1 className="text-3xl font-libre capitalize">Session Packages</h1>
          <AppButton
            outlined
            onClick={() => {
              onOpen();
              setIsEdit(false);
              setForm({ type: "", price: "", packagePrice: "", totalSessions: "", categoryId: "", duration: "", remarks: "" });
            }}
          >
            Add Session Package
          </AppButton>
        </div>

        {/* Package Statistics */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={6}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel display="flex" alignItems="center" gap={2}>
                  <FaUsers color="#3182CE" />
                  Total Packages
                </StatLabel>
                <StatNumber>{packageStats.totalPackages}</StatNumber>
                <StatHelpText>Created by you</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Stat>
                <StatLabel display="flex" alignItems="center" gap={2}>
                  <FaMoneyBillWave color="#38A169" />
                  Package Revenue
                </StatLabel>
                <StatNumber>₹{packageStats.totalRevenue.toLocaleString()}</StatNumber>
                <StatHelpText>From completed sessions</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Stat>
                <StatLabel display="flex" alignItems="center" gap={2}>
                  <FaChartLine color="#805AD5" />
                  Session Usage
                </StatLabel>
                <StatNumber>{packageStats.usedSessions}/{packageStats.totalSessions}</StatNumber>
                <StatHelpText>
                  <Progress 
                    value={(packageStats.usedSessions / packageStats.totalSessions) * 100} 
                    colorScheme="purple" 
                    size="sm" 
                    mt={1}
                  />
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Completion Rate</StatLabel>
                <StatNumber>
                  {packageStats.totalSessions > 0 
                    ? Math.round((packageStats.usedSessions / packageStats.totalSessions) * 100)
                    : 0}%
                </StatNumber>
                <StatHelpText>Sessions completed</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        <div className="mb-4">
          <Input
            placeholder="Search by session type or category..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full md:w-1/3 bg-white"
          />
        </div>

        {isLoadingPackages ? (
          <div className="flex justify-center">
            <AiOutlineLoading size={100} className="animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPackages.map((pkg) => {
              const category = pkg.categoryId as any;
              const usedSessions = pkg.totalSessions - pkg.remainingSessions;
              const completionRate = (usedSessions / pkg.totalSessions) * 100;
              const revenue = pkg.price * usedSessions;
              
              return (
                <Card key={pkg._id} variant="outline">
                  <CardHeader pb={2}>
                    <div className="flex justify-between items-start">
                      <div>
                        <Heading size="md" textTransform="capitalize">
                          {pkg.type} Session Package
                        </Heading>
                        <Text fontSize="sm" color="gray.600">
                          {category?.title || 'Unknown Category'}
                        </Text>
                      </div>
                      <div className="flex gap-2">
                        <AiOutlineEdit
                          className="cursor-pointer text-blue-600 hover:text-blue-800"
                          onClick={() => handleEdit(pkg)}
                          size={18}
                        />
                        <AiOutlineDelete
                          className="cursor-pointer text-red-600 hover:text-red-800"
                          onClick={() => handleDelete(pkg)}
                          size={18}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardBody pt={0}>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Text fontWeight="bold" fontSize="lg" color="green.600">
                          ₹{pkg.price} per session
                        </Text>
                        <Badge colorScheme={pkg.remainingSessions > 0 ? 'green' : 'gray'}>
                          {pkg.remainingSessions > 0 ? 'Active' : 'Completed'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Text color="gray.600">Total Sessions</Text>
                          <Text fontWeight="semibold">{pkg.totalSessions}</Text>
                        </div>
                        <div>
                          <Text color="gray.600">Used Sessions</Text>
                          <Text fontWeight="semibold">{usedSessions}</Text>
                        </div>
                        <div>
                          <Text color="gray.600">Remaining</Text>
                          <Text fontWeight="semibold" color={pkg.remainingSessions > 0 ? 'green.600' : 'red.600'}>
                            {pkg.remainingSessions}
                          </Text>
                        </div>
                        <div>
                          <Text color="gray.600">Revenue</Text>
                          <Text fontWeight="semibold" color="green.600">₹{revenue}</Text>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <Text fontSize="sm" color="gray.600">Progress</Text>
                          <Text fontSize="sm" color="gray.600">{Math.round(completionRate)}%</Text>
                        </div>
                        <Progress 
                          value={completionRate} 
                          colorScheme={completionRate === 100 ? 'green' : 'blue'} 
                          size="sm" 
                          borderRadius="md"
                        />
                      </div>
                      
                      <Text fontSize="xs" color="gray.500">
                        Created: {moment(pkg.createdAt).format("MMM DD, YYYY")}
                      </Text>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
        
        {filteredPackages.length === 0 && !isLoadingPackages && (
          <Box textAlign="center" py={10}>
            <Text fontSize="lg" color="gray.500">
              {searchText ? 'No packages found matching your search.' : 'No session packages created yet.'}
            </Text>
            <Text fontSize="sm" color="gray.400" mt={2}>
              {!searchText && 'Create your first session package to get started!'}
            </Text>
          </Box>
        )}

        <Modal isOpen={isOpen} onClose={onClose} isCentered>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              {isEdit ? "Edit" : "Add"} Session Package
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody className="flex flex-col gap-4">
              <FormControl>
                <FormLabel>Session Type</FormLabel>
                <Select
                  placeholder="Select session type"
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                >
                  <option value="chat">Chat</option>
                  <option value="audio">Audio</option>
                  <option value="video">Video</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Price per session</FormLabel>
                <Input
                  type="number"
                  placeholder="e.g., 999"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Total Sessions</FormLabel>
                <Input
                  type="number"
                  placeholder="e.g., 5"
                  name="totalSessions"
                  value={form.totalSessions}
                  onChange={handleChange}
                />
              </FormControl>
              <FormControl>
                <FormLabel>
                  Package Price (Actual Price: ₹
                  {form.price && form.totalSessions
                    ? Number(form.price) * Number(form.totalSessions)
                    : 0})
                </FormLabel>
                <Input
                  type="number"
                  placeholder="e.g., 3999"
                  name="packagePrice"
                  value={form.packagePrice}
                  onChange={handleChange}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Discount Amount (₹)</FormLabel>
                <Input
                  isDisabled
                  value={
                    form.price && form.totalSessions && form.packagePrice
                      ? (
                          Number(form.price) * Number(form.totalSessions) -
                          Number(form.packagePrice)
                        ).toFixed(2)
                      : "0.00"
                  }
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Category</FormLabel>
                {isProfileLoading ? (
                  <Spinner />
                ) : (
                  <Select
                    placeholder="Select category"
                    name="categoryId"
                    value={form.categoryId}
                    onChange={handleChange}
                  >
                    {profileData?.data?.category?.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.title}
                      </option>
                    ))}
                  </Select>
                )}
              </FormControl>
              <FormControl>
                <FormLabel>Remarks (Optional)</FormLabel>
                <Input
                  placeholder="Add any additional notes or remarks"
                  name="remarks"
                  value={form.remarks}
                  onChange={handleChange}
                />
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <AppButton outlined onClick={handleSubmit}>
                {isEdit ? "Update" : "Submit"}
              </AppButton>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <AlertDialog
          isOpen={isDeleteOpen}
          leastDestructiveRef={undefined}
          onClose={onDeleteClose}
          isCentered
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Delete Session Package
              </AlertDialogHeader>

              <AlertDialogBody>
                Are you sure you want to delete this {packageToDelete?.type} session package? 
                This action cannot be undone and will permanently remove the package.
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button onClick={onDeleteClose}>
                  Cancel
                </Button>
                <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                  Delete
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </div>
    </MentorLayout>
  );
};
