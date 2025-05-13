"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import toast from 'react-hot-toast';
import { getUserId } from "@/utils/auth";
import { useFindUniqueAccount, useUpdateAccount } from "@/generated/hooks";
import { UserCircle } from "lucide-react";

const profileFormSchema = z.object({
  username: z.string().min(2, {
    message: "Tên phải có ít nhất 2 ký tự.",
  }),
  email: z.string().email({
    message: "Email không hợp lệ.",
  }),
  phone: z.string().min(10, {
    message: "Số điện thoại phải có ít nhất 10 số.",
  }),
  dateOfBirth: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const userId = getUserId();

  // Fetch user account data
  const { data: userData, isLoading } = useFindUniqueAccount(
    {
      where: { id: userId || "" },
      include: {
        customUser: true,
      },
    },
    {
      enabled: !!userId,
    }
  );

  const updateAccount = useUpdateAccount();

  // Create form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: "",
      email: "",
      phone: "",
      dateOfBirth: "",
    },
  });

  // Update form values when user data is loaded
  useEffect(() => {
    if (userData) {
      form.reset({
        username: userData.username || "",
        email: userData.email || "",
        phone: userData.phone || "",
        dateOfBirth: userData.dateOfBirth 
          ? new Date(userData.dateOfBirth).toISOString().split("T")[0] 
          : "",
      });
    }
  }, [userData, form]);

  // Handle form submission
  function onSubmit(data: ProfileFormValues) {
    if (!userId) return;

    const loadingToast = toast.loading('Đang cập nhật thông tin...');

    updateAccount.mutate(
      {
        where: { id: userId },
        data: {
          username: data.username,
          email: data.email,
          phone: data.phone,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        },
      },
      {
        onSuccess: () => {
          toast.dismiss(loadingToast);
          toast.success('Thông tin cá nhân đã được cập nhật thành công');
        },
        onError: (error) => {
          toast.dismiss(loadingToast);
          toast.error(`Không thể cập nhật thông tin: ${error.message}`);
        },
      }
    );
  }

  if (isLoading) {
    return <div className="flex justify-center py-8">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Hồ sơ người dùng</h1>
      </div>

        <Card>
          <CardHeader>
            <CardTitle>Thông tin cá nhân</CardTitle>
              <CardDescription>
                Cập nhật thông tin cá nhân của bạn tại đây
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center mb-6">
                <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                  <UserCircle className="w-24 h-24 text-gray-400" />
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Nguyễn Văn A" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="example@gmail.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Số điện thoại</FormLabel>
                        <FormControl>
                          <Input placeholder="0123456789" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ngày sinh</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={updateAccount.isPending}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {updateAccount.isPending ? "Đang cập nhật..." : "Cập nhật"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
    </div>
  );
} 