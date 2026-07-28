"use client";

import type React from "react";

import { useState, useCallback, useMemo, useEffect } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ScrollArea } from "../ui/scroll-area";
import { ImageIcon, Upload, Link, Grid, Check, Loader2 } from "lucide-react";
import type { Editor } from "@tiptap/react";
import useUpload from "../../lib/utils/useUpload";
import { supabase } from "../../lib/supabase/client";
import { useToast } from "../../hooks/use-toast";

interface ImageUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editor: Editor | null;
}

interface UserImage {
  id: string;
  url: string;
  name: string;
  created_at: string;
}

export function ImageUploadModal({
  open,
  onOpenChange,
  editor,
}: ImageUploadModalProps) {
  const [imageUrl, setImageUrl] = useState("");
  const [altText, setAltText] = useState("");
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<
    string | null
  >(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [userImages, setUserImages] = useState<UserImage[]>([]);
  const [loadingUserImages, setLoadingUserImages] = useState(false);
  const { toast } = useToast();

  const [upload, { loading: uploadLoading }] = useUpload() as [
    (input: any) => Promise<any>,
    { loading: boolean },
  ];

  // Fetch user images from Supabase storage
  const fetchUserImages = useCallback(async () => {
    setLoadingUserImages(true);
    try {
      // Get current user
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) {
        throw new Error("User not authenticated");
      }

      // List files in user's directory
      const { data: files, error } = await supabase.storage
        .from("uploads")
        .list(userId, {
          limit: 100,
          offset: 0,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (error) {
        console.error("Error fetching user images:", error);
        return;
      }

      // Get public URLs for each image
      const imagePromises = (files || [])
        .filter((file: any) => file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i))
        .slice(0, 24) // Limit to 24 images for performance
        .map(async (file: any) => {
          const { data: urlData } = supabase.storage
            .from("uploads")
            .getPublicUrl(`${userId}/${file.name}`);

          return {
            id: file.id,
            url: urlData.publicUrl,
            name: file.name,
            created_at: file.created_at,
          };
        });

      const images = await Promise.all(imagePromises);
      setUserImages(images);
    } catch (error) {
      console.error("Error fetching user images:", error);
    } finally {
      setLoadingUserImages(false);
    }
  }, []);

  // Fetch user images when gallery tab is opened
  useEffect(() => {
    if (open) {
      fetchUserImages();
    }
  }, [open, fetchUserImages]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setUploadedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setUploadedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const insertImage = (url: string, alt: string) => {
    if (editor && url) {
      editor.chain().focus().setImage({ src: url, alt, width: null, align: null, float: null }).run();
      onOpenChange(false);
      resetState();
    }
  };

  const resetState = () => {
    setImageUrl("");
    setAltText("");
    setSelectedGalleryImage(null);
    setUploadedFile(null);
    setPreviewUrl(null);
  };

  const handleInsert = async () => {
    if (selectedGalleryImage) {
      // Handle local gallery image selection
      try {
        insertImage(selectedGalleryImage, "Gallery image");
      } catch (error) {
        console.error("Error inserting gallery image:", error);
        // Fallback to placeholder if there's an error
        insertImage(selectedGalleryImage, "Gallery image");
      }
    } else if (previewUrl && uploadedFile) {
      // Handle file upload
      try {
        const result = await upload({
          file: uploadedFile,
        });

        if (result?.url) {
          insertImage(result.url, altText || "Uploaded image");
          // Refresh user images after uploading a new one
          fetchUserImages();
        } else {
          throw new Error("Failed to upload image");
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        toast({
          title: "Upload Failed",
          description: "Failed to upload image. Please try again.",
          variant: "destructive",
        });
      }
    } else if (imageUrl) {
      // Handle URL insertion
      try {
        insertImage(imageUrl, altText || "Image from URL");
        // Refresh user images after adding a new one
        fetchUserImages();
      } catch (error) {
        console.error("Error inserting image from URL:", error);
        toast({
          title: "Insert Failed",
          description: "Failed to insert image. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Clean up object URLs on unmount
  useMemo(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          resetState();
        }
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Insert Image
          </DialogTitle>
          <DialogDescription>
            Upload an image, enter a URL, or choose from the gallery
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" className="flex items-center gap-1">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center gap-1">
              <Link className="h-4 w-4" />
              URL
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-1">
              <Grid className="h-4 w-4" />
              Gallery
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent
              value="upload"
              className="space-y-4 py-4 h-full flex flex-col"
            >
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors flex-1 flex flex-col items-center justify-center ${
                  isDragging ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                {previewUrl ? (
                  <div className="space-y-4">
                    <img
                      src={previewUrl || "/placeholder.svg"}
                      alt="Preview"
                      className="max-h-48 mx-auto rounded-lg"
                    />
                    <p className="text-sm text-muted-foreground">
                      {uploadedFile?.name}
                    </p>
                    <Button
                      variant="outline"
                      className="rounded-lg bg-gray-500 hover:bg-white transition-colors cursor-pointer"
                      size="sm"
                      onClick={() => {
                        setUploadedFile(null);
                        setPreviewUrl(null);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm font-medium">
                      Drag and drop an image here
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">or</p>
                    <label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        className="rounded-lg bg-gray-500 hover:bg-white transition-colors cursor-pointer"
                        size="sm"
                        asChild
                      >
                        <span>Browse Files</span>
                      </Button>
                    </label>
                  </>
                )}
              </div>

              {previewUrl && (
                <div className="space-y-2">
                  <Label>Alt Text</Label>
                  <Input
                    placeholder="Describe the image..."
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="url" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Alt Text</Label>
                <Input
                  placeholder="Describe the image..."
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                />
              </div>

              {imageUrl && (
                <div className="border rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                  <img
                    src={imageUrl || "/placeholder.svg"}
                    alt={altText || "Preview"}
                    className="max-h-48 mx-auto rounded-lg"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="gallery" className="py-4 h-full flex flex-col">
              <ScrollArea className="flex-1 min-h-0 h-full">
                <div className="h-full overflow-y-auto">
                  {loadingUserImages ? (
                    <div className="flex justify-center items-center h-full min-h-[16rem]">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : userImages.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3 p-1">
                      {userImages.map((image) => (
                        <button
                          key={image.id}
                          onClick={() => {
                            // Directly insert the selected gallery image
                            setSelectedGalleryImage(image.url);
                            insertImage(image.url, "Gallery image");
                          }}
                          className="relative rounded-lg overflow-hidden border-2 transition-all border-transparent hover:border-border"
                        >
                          <img
                            src={image.url}
                            alt={image.name}
                            className="w-full h-24 object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/placeholder.svg";
                            }}
                          />
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <Check className="h-6 w-6 text-primary" />
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full min-h-[16rem] text-muted-foreground">
                      <Grid className="h-12 w-12 mb-4" />
                      <p>No images in your gallery yet</p>
                      <p className="text-sm mt-2">
                        Upload images to see them appear here
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="mt-4 text-xs text-muted-foreground text-center">
                <p>Your previously uploaded images will appear here</p>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            className="rounded-lg bg-gray-500 hover:bg-white transition-colors cursor-pointer"
            onClick={() => {
              onOpenChange(false);
              resetState();
            }}
          >
            Cancel
          </Button>
          <Button
            className="rounded-lg bg-blue-500 hover:bg-blue-600 transition-colors cursor-pointer"
            onClick={handleInsert}
            disabled={
              (!selectedGalleryImage && !previewUrl && !imageUrl) ||
              uploadLoading
            }
          >
            {uploadLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Insert Image"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
