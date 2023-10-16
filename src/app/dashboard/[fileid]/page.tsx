interface PageProps {
    params:{
        fileid:string
    }
}

function page({params}:PageProps) {
    const {fileid} = params
  return (
    <div>{fileid}</div>
  )
}

export default page