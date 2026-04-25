"use client";

import type React from "react";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
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
import {
  ImageIcon,
  Upload,
  Link,
  Grid,
  Check,
  Search,
  Loader2,
} from "lucide-react";
import type { Editor } from "@tiptap/react";
import useUpload from "../../lib/utils/useUpload";
import { supabase } from "../../lib/supabase/client";
import { useToast } from "../../hooks/use-toast";

interface ImageUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editor: Editor | null;
}

interface UnsplashImage {
  id: string;
  url: string;
  thumb: string;
  alt: string;
  author: string;
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

  // Unsplash search states
  const [onlineImageQuery, setOnlineImageQuery] = useState("");
  const [onlineImages, setOnlineImages] = useState<UnsplashImage[]>([]);
  const [onlineImageLoading, setOnlineImageLoading] = useState(false);
  const [onlineImageError, setOnlineImageError] = useState<string | null>(null);
  const [selectedOnlineImage, setSelectedOnlineImage] = useState<string | null>(
    null,
  );

  const [upload, { loading: uploadLoading, searchUnsplashImages }] =
    useUpload() as [
      (input: any) => Promise<any>,
      {
        loading: boolean;
        searchUnsplashImages: (query: string, page?: number) => Promise<any>;
      },
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
      editor.chain().focus().setImage({ src: url, alt }).run();
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
    setOnlineImageQuery("");
    setOnlineImages([]);
    setSelectedOnlineImage(null);
    setOnlineImageError(null);
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
    } else if (selectedOnlineImage) {
      // Handle Unsplash image selection
      const image = onlineImages.find((img) => img.id === selectedOnlineImage);
      if (image) {
        try {
          // Upload the Unsplash image to our servers
          const result = await upload({
            url: image.url,
            source: "unsplash",
          });

          if (result?.url) {
            insertImage(result.url, image.alt || "Unsplash image");
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

  // Ref for debouncing search
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleOnlineImageSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setOnlineImages([]);
        return;
      }

      try {
        setOnlineImageLoading(true);
        setOnlineImageError(null);

        const results = await searchUnsplashImages(query);
        setOnlineImages(results.results);
      } catch (error) {
        setOnlineImageError("Failed to search images. Please try again.");
      } finally {
        setOnlineImageLoading(false);
      }
    },
    [searchUnsplashImages],
  );

  // Auto-search as user types with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (onlineImageQuery.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        handleOnlineImageSearch(onlineImageQuery);
      }, 500); // 500ms debounce delay
    } else {
      setOnlineImages([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [onlineImageQuery, handleOnlineImageSearch]);

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
      }}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Insert Image
          </DialogTitle>
          <DialogDescription>
            Upload an image, enter a URL, search online images, or choose from
            the gallery
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload" className="flex items-center gap-1">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center gap-1">
              <Link className="h-4 w-4" />
              URL
            </TabsTrigger>
            <TabsTrigger value="online" className="flex items-center gap-1">
              <Search className="h-4 w-4" />
              Online
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-1">
              <Grid className="h-4 w-4" />
              Gallery
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent
              value="upload"
              className="space-y-4 py-4 h-full flex flex-col">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors flex-1 flex flex-col items-center justify-center ${
                  isDragging ? "border-primary bg-primary/5" : "border-border"
                }`}>
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
                      }}>
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
                        asChild>
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

            <TabsContent value="online" className="py-4 h-full flex flex-col">
              <div className="flex flex-col h-full">
                {/* Search input section - fixed height */}
                <div className="flex-shrink-0 mb-4">
                  <div className="flex space-x-2">
                    <Input
                      type="text"
                      value={onlineImageQuery}
                      onChange={(e) => setOnlineImageQuery(e.target.value)}
                      placeholder="Search for images..."
                    />
                    <Button
                      className="bg-blue-500 hover:bg-blue-600 transition-colors cursor-pointer"
                      onClick={() => handleOnlineImageSearch(onlineImageQuery)}
                      disabled={onlineImageLoading || !onlineImageQuery.trim()}>
                      {onlineImageLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Search"
                      )}
                    </Button>
                  </div>
                </div>

                {/* Error message section - only shown when there's an error */}
                {onlineImageError && (
                  <div className="flex-shrink-0 mb-4 p-3 bg-destructive/10 text-destructive rounded-lg">
                    {onlineImageError}
                  </div>
                )}

                {/* Results section - takes remaining space with proper scrolling */}
                <div className="flex-grow overflow-hidden">
                  {onlineImageLoading ? (
                    <div className="h-full flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : onlineImages.length > 0 ? (
                    <ScrollArea className="h-full">
                      <div className="p-4 pb-0">
                        {/* Grid container with explicit overflow control */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-4">
                          {onlineImages.map((image) => (
                            <div
                              key={image.id}
                              className={`border rounded-lg overflow-hidden hover:shadow-md transition-all cursor-pointer relative ${
                                selectedOnlineImage === image.id
                                  ? "ring-2 ring-primary border-primary"
                                  : "border-border"
                              }`}
                              onClick={() => {
                                setSelectedOnlineImage(image.id);
                              }}>
                              <div className="aspect-square overflow-hidden">
                                <img
                                  src={image.thumb || image.url}
                                  alt={image.alt}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              {selectedOnlineImage === image.id && (
                                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                  <Check className="h-6 w-6 text-primary" />
                                </div>
                              )}
                              <div className="p-2">
                                <p className="text-xs text-muted-foreground truncate">
                                  {image.alt}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  by {image.author}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      {onlineImageQuery ? (
                        <div className="text-center">
                          <Search className="h-12 w-12 mx-auto mb-4" />
                          <p className="font-medium">
                            No images found for "{onlineImageQuery}"
                          </p>
                          <p className="text-sm mt-1">
                            Try a different search term
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Search className="h-12 w-12 mr-4" />
                          <div>
                            <p className="font-medium">
                              Search for images on Unsplash
                            </p>
                            <p className="text-sm mt-1">
                              Enter a keyword above to find relevant images
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer note - fixed height */}
                <div className="flex-shrink-0 mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Note: These images are sourced from Unsplash. By inserting
                    an image, you agree to Unsplash's licensing terms.
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="gallery" className="py-4 h-full flex flex-col">
              <ScrollArea className="flex-1">
                {loadingUserImages ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : userImages.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {userImages.map((image) => (
                      <button
                        key={image.id}
                        onClick={() => {
                          // Directly insert the selected gallery image
                          setSelectedGalleryImage(image.url);
                          insertImage(image.url, "Gallery image");
                        }}
                        className="relative rounded-lg overflow-hidden border-2 transition-all border-transparent hover:border-border">
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
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <Grid className="h-12 w-12 mb-4" />
                    <p>No images in your gallery yet</p>
                    <p className="text-sm mt-2">
                      Upload images to see them appear here
                    </p>
                  </div>
                )}
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
            }}>
            Cancel
          </Button>
          <Button
            className="rounded-lg bg-blue-500 hover:bg-blue-600 transition-colors cursor-pointer"
            onClick={handleInsert}
            disabled={
              (!selectedGalleryImage &&
                !selectedOnlineImage &&
                !previewUrl &&
                !imageUrl) ||
              uploadLoading ||
              onlineImageLoading
            }>
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
