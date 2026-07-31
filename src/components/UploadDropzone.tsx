'use client'

import { Cloud, File, Loader2 } from 'lucide-react'
import { useState } from 'react'
import Dropzone from 'react-dropzone'
import { Progress } from "@/components/ui/progress"
import { useUploadThing } from '@/lib/uploadthing'
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from 'next/navigation'
import { trpc } from '@/app/_trpc/client'


function UploadDropzone({isSubscribed}:{isSubscribed:boolean}) {
    const [isUploading, setIsUploading] = useState<boolean>(false)
    const [uploadProgress, setUploadProgress] = useState<number>(0)
    const { toast } = useToast()
    const router = useRouter()

    const { startUpload } = useUploadThing(
        isSubscribed ? "proplanUploader" : "freeplanUploader"
    )

    const { mutate: startPolling } = trpc.getFile.useMutation(
        {
            onSuccess: (file) => {
                router.push(`${process.env.NEXT_PUBLIC_APP_VERCEL_URL}/dashboard/${file.id}`)
            },
            retry: true,
            retryDelay: 500,
        }
    )

    const startSimulatedProgress = () => {
        setUploadProgress(0)

        const interval = setInterval(() => {
            setUploadProgress((prevProgress) => {
                if (prevProgress >= 95) {
                    clearInterval(interval)
                    return prevProgress
                }

                return prevProgress + 5
            })
        }, 500)

        return interval
    }

    return (
        <Dropzone
          multiple={false}
          onDrop={async (acceptedFile) => {
            setIsUploading(true);
            const progressInterval = startSimulatedProgress();
        
            try {
              // Handle file upload
              const res = await startUpload(acceptedFile);
        
              if (!res) {
                clearInterval(progressInterval);
                setIsUploading(false);
        
                toast({
                  title: "Something went wrong",
                  description: "Please try again later.",
                  variant: "destructive",
                });
        
                return;
              }
        
              const [fileResponse] = res;
              const key = fileResponse?.key;
        
              if (!key) {
                clearInterval(progressInterval);
                setIsUploading(false);
        
                toast({
                  title: "Something went wrong",
                  description: "Please try again later.",
                  variant: "destructive",
                });
        
                return;
              }
        
              clearInterval(progressInterval);
              setUploadProgress(100);
        
              startPolling({ key });
            } catch (error) {
              console.error("UploadThing Error:", error);
        
              clearInterval(progressInterval);
              setIsUploading(false);
        
              toast({
                title: "Upload failed",
                description: "An unexpected error occurred. Please try again.",
                variant: "destructive",
              });
            }
          }}
        >
        
            {({ getRootProps, getInputProps, acceptedFiles }) => (
                <div {...getRootProps()} className='border h-64 m-4 border-dashed border-gray-300 rounded-lg'>
                    <div className='flex items-center justify-center h-full w-full'>
                        <label htmlFor="dropzpne-file" className='flex flex-col items-center justify-center w-full h-full rounded-lg    cursor-pointer bg-gray-50 hover:bg-gray-100'>
                            <div className='flex flex-col items-center justify-center p-5 pb-6'>
                                <Cloud className='h-6 w-6 twxt-zinc-500 mb-2' />
                                <p className='mb-2 text-sm text-zinc-700'>
                                    <span className='font-semibold'>click to upload</span> or drag and drop
                                </p>
                                <p className='text-zinc-700 text-xs'>PDF ({isSubscribed ? "16" : "4"}MB)</p>
                            </div>

                            {acceptedFiles && acceptedFiles[0] ? (
                                <div className='max-w-xs bg-white flex items-center rounded-md overflow-hidden outline outline-[1px] outline-zinc-200 divide-zinc-200'>
                                    <div className='px-3 py-2 h-full grid place-items-center'>
                                        <File className='h-4 w-4 text-purple-500' />
                                    </div>

                                    <div className='px-3 py-2 h-full text-sm truncate'>
                                        {acceptedFiles[0].name}
                                    </div>
                                </div>
                            ) : null}

                            {isUploading ? (
                                <div className='w-full mt-4 max-w-xs mx-auto'>
                                    <Progress
                                     indicatorColor={uploadProgress === 100 ? 'bg-green-500' : ""}
                                      value={uploadProgress} className='h-1 w-full bg-zinc-200' />
                                    {uploadProgress === 100 ? (
                                        <div className='flex gap-1 items-center justify-center text-sm text-zinc-700 text-center pt-2'>
                                            <Loader2 className='h-3 w-3 animate-spin' />
                                            Redirecting...
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}

                            <input
                                {...getInputProps()}
                                type='file'
                                id='dropzone-file'
                                className='hidden'
                            />
                        </label>
                    </div>
                </div>
            )}
        </Dropzone>
    )
}

export default UploadDropzone