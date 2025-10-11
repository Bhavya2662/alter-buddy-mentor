import React, { useEffect } from "react";
import { MainLayout } from "../../../layout";
import { useGetAllBlogQuery, useGetUserBlogsQuery } from "../../../redux/rtk-api";
import { useProfileUserQuery } from "../../../redux/rtk-api/authentication.api";
import { useAppDispatch } from "../../../redux";
import { handleError, useAuthenticationSlice } from "../../../redux/features";
import { AppButton, BlogCard } from "../../../component";
import { useNavigate } from "react-router-dom";
import { Box, Grid, Tabs, TabList, TabPanels, Tab, TabPanel, Heading, useToast } from "@chakra-ui/react";


export const BuddyTubePage = () => {
  const navigate = useNavigate();
  const { authentication } = useAuthenticationSlice();
  const dispatch = useAppDispatch();
  const toast = useToast();
  
  // Fetch user profile to check blog permissions
  const { data: userProfile } = useProfileUserQuery(undefined, {
    skip: !authentication,
  });
  
  const {
    data: blogs,
    isError: isBlogError,
    isLoading: isBlogLoading,
    error: blogError,
  } = useGetAllBlogQuery();
  
  const {
    data: userBlogs,
    isError: isUserBlogError,
    isLoading: isUserBlogLoading,
    error: userBlogError,
  } = useGetUserBlogsQuery(undefined, {
    skip: !authentication, // Only fetch if user is authenticated
  });

  useEffect(() => {
    if (isBlogError) {
      dispatch(handleError((blogError as any).data.message));
    }
  }, [isBlogError, blogError, dispatch]);

  useEffect(() => {
    if (isUserBlogError) {
      dispatch(handleError((userBlogError as any).data.message));
    }
  }, [isUserBlogError, userBlogError, dispatch]);

  return (
    <MainLayout loading={isBlogLoading}>
      <div className="bg-gradient-to-t from-white to-primary-300 xl:px-0 px-5 pt-20 pb-16">
        <div className="border border-primary-500 pt-20 pb-16 px-10 xl:w-[80%] mx-auto bg-white rounded-md flex flex-col gap-5">
          <h1 className="text-3xl">
            Read articles for basic brain development
          </h1>
          <p className="text-gray-500">
            Lorem ipsum dolor sit amet consectetur, adipisicing elit. Facilis,
            debitis reprehenderit veniam eligendi neque fugiat quibusdam aut
            consequuntur, nemo corporis minima totam dicta eaque inventore,
            distinctio expedita earum laboriosam recusandae!
          </p>
          <div className="flex gap-4 flex-wrap">
            <AppButton onClick={() => {
                  if(!authentication){
                    navigate('/sign-in')

                  }else{
                    navigate('/mentor/list')

                  }
                }
                  
                } filled>Get in touch with mentor</AppButton>
            
            {authentication && userProfile?.data?.canWriteBlog && (
              <AppButton 
                onClick={() => navigate('/blog-create')}
                outlined
              >
                Create Blog
              </AppButton>
            )}
            {authentication && !userProfile?.data?.canWriteBlog && (
              <AppButton 
                onClick={() => {
                  toast({
                    title: 'Permission Required',
                    description: 'You need blog writing permission to create blogs. Contact an administrator.',
                    status: 'warning',
                    duration: 4000,
                  });
                }}
                outlined
                disabled
              >
                Create Blog (Permission Required)
              </AppButton>
            )}
            {!authentication && (
              <AppButton 
                onClick={() => navigate('/sign-in')}
                outlined
              >
                Create Blog
              </AppButton>
            )}
          </div>
        </div>
         <input
              type="text"
              placeholder="Search by name, specialty, or condition..."
              className="bg-transparent w-full py-1 text-gray-700 placeholder-gray-500 focus:outline-none"
            />
        <Box className="section-container" pb={16} mt={12}>
          {authentication ? (
            <Tabs variant="enclosed" colorScheme="pink">
              <TabList>
                <Tab>All Blogs</Tab>
                <Tab>My Blogs</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <Grid justifyContent={'center'} alignItems={'center'} templateColumns={{
                    base: '1fr',
                    sm: '1fr 1fr',
                    md: 'repeat(3,1fr)',
                    lg: 'repeat(3,1fr)',
                  }} gap={6}>
                    {blogs?.data.map(
                      ({ body, label, subLabel, _id, createdAt, blogLink, featuredImage, author, readTime, tags }) => (
                        <BlogCard
                          key={_id}
                          _id={_id}
                          body={body}
                          label={label}
                          subLabel={subLabel}
                          blogLink={blogLink}
                          createdAt={createdAt as string}
                          featuredImage={featuredImage}
                          author={author}
                          readTime={readTime}
                          tags={tags}
                        />
                      )
                    )}
                  </Grid>
                </TabPanel>
                <TabPanel>
                  {isUserBlogLoading ? (
                    <Box textAlign="center" py={8}>
                      Loading your blogs...
                    </Box>
                  ) : userBlogs?.data?.length > 0 ? (
                    <Grid justifyContent={'center'} alignItems={'center'} templateColumns={{
                      base: '1fr',
                      sm: '1fr 1fr',
                      md: 'repeat(3,1fr)',
                      lg: 'repeat(3,1fr)',
                    }} gap={6}>
                      {userBlogs.data.map(
                        ({ body, label, subLabel, _id, createdAt, blogLink, featuredImage, author, readTime, tags }) => (
                          <BlogCard
                            key={_id}
                            _id={_id}
                            body={body}
                            label={label}
                            subLabel={subLabel}
                            blogLink={blogLink}
                            createdAt={createdAt as string}
                            featuredImage={featuredImage}
                            author={author}
                            readTime={readTime}
                            tags={tags}
                          />
                        )
                      )}
                    </Grid>
                  ) : (
                    <Box textAlign="center" py={8}>
                      <Heading size="md" color="gray.500" mb={4}>
                        You haven't created any blogs yet
                      </Heading>
                      {userProfile?.data?.canWriteBlog ? (
                        <AppButton onClick={() => navigate('/blog-create')} filled>
                          Create Your First Blog
                        </AppButton>
                      ) : (
                        <AppButton 
                          onClick={() => {
                            toast({
                              title: 'Permission Required',
                              description: 'You need blog writing permission to create blogs. Contact an administrator.',
                              status: 'warning',
                              duration: 4000,
                            });
                          }}
                          filled
                          disabled
                        >
                          Create Blog (Permission Required)
                        </AppButton>
                      )}
                    </Box>
                  )}
                </TabPanel>
              </TabPanels>
            </Tabs>
          ) : (
            <Grid justifyContent={'center'} alignItems={'center'} templateColumns={{
              base: '1fr',
              sm: '1fr 1fr',
              md: 'repeat(3,1fr)',
              lg: 'repeat(3,1fr)',
            }} gap={6}>
              {blogs?.data.map(
                ({ body, label, subLabel, _id, createdAt, blogLink, featuredImage, author, readTime, tags }) => (
                  <BlogCard
                    key={_id}
                    _id={_id}
                    body={body}
                    label={label}
                    subLabel={subLabel}
                    blogLink={blogLink}
                    createdAt={createdAt as string}
                    featuredImage={featuredImage}
                    author={author}
                    readTime={readTime}
                    tags={tags}
                  />
                )
              )}
            </Grid>
          )}
        </Box>
      </div>
      {/* <CardSection data={data}/> */}
    </MainLayout>
  );
};
