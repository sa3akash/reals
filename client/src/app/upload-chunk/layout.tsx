import React, { PropsWithChildren } from 'react'



const UPloadLayout = ({children}:PropsWithChildren) => {
  return (
    <div className='h-screen flex items-center justify-center'>{children}</div>
  )
}

export default UPloadLayout