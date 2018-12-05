import React from 'react'
import _ from 'lodash'

// Slack-like placeholder :)
const PATTERN_1 = (
  <div className='flex py-2 px-4'>
    <div className='bg-grey-light w-10 h-10 rounded flex-none' />

    <div className='w-full flex-1'>
      <div className='mt-1 flex'>
        <div className='ml-2 bg-grey-light w-32 h-2 rounded-full' />
        <div className='ml-2 bg-grey-light w-16 h-2 rounded-full' />
      </div>

      <div className='mt-3 flex'>
        <div className='ml-2 bg-grey-light w-16 h-2 rounded-full' />
        <div className='ml-2 bg-grey-light w-64 h-2 rounded-full' />
      </div>
    </div>
  </div>
)

const PATTERN_2 = (
  <div className='flex py-2 px-4'>
    <div className='bg-grey-light w-10 h-10 rounded flex-none' />

    <div className='w-full flex-1'>
      <div className='mt-1 flex'>
        <div className='ml-2 bg-grey-light w-32 h-2 rounded-full' />
        <div className='ml-2 bg-grey-light w-16 h-2 rounded-full' />
      </div>

      <div className='mt-3 flex'>
        <div className='ml-2 bg-grey-light w-16 h-2 rounded-full' />
        <div className='ml-2 bg-grey-light w-48 h-2 rounded-full' />
      </div>
    </div>
  </div>
)

const PATTERN_3 = (
  <div className='flex py-2 px-4'>
    <div className='bg-grey-light w-10 h-10 rounded flex-none' />

    <div className='w-full flex-1'>
      <div className='mt-1 flex'>
        <div className='ml-2 bg-grey-light w-32 h-2 rounded-full' />
        <div className='ml-2 bg-grey-light w-8 h-2 rounded-full' />
      </div>

      <div className='mt-3 flex'>
        <div className='ml-2 bg-grey-light w-48 h-2 rounded-full' />
      </div>
    </div>
  </div>
)

const PATTERN_4 = (
  <div className='flex py-2 px-4'>
    <div className='bg-grey-light w-10 h-10 rounded flex-none' />

    <div className='w-full flex-1'>
      <div className='mt-1 flex'>
        <div className='ml-2 bg-grey-light w-32 h-2 rounded-full' />
        <div className='ml-2 bg-grey-light w-8 h-2 rounded-full' />
      </div>

      <div className='mt-3 flex'>
        <div className='ml-2 bg-grey-light w-24 h-2 rounded-full' />
      </div>
    </div>
  </div>
)

const PATTERN_5 = (
  <div className='flex py-2 px-4'>
    <div className='bg-grey-light w-10 h-10 rounded flex-none' />

    <div className='w-full flex-1'>
      <div className='mt-1 flex'>
        <div className='ml-2 bg-grey-light w-32 h-2 rounded-full' />
        <div className='ml-2 bg-grey-light w-8 h-2 rounded-full' />
      </div>

      <div className='mt-3 flex'>
        <div className='ml-2 bg-grey-light w-64 h-48 rounded' />
      </div>
    </div>
  </div>
)

// Random patterns.
const PATTERNS = [
  PATTERN_1,
  PATTERN_2,
  PATTERN_3,
  PATTERN_4,
  PATTERN_5,
]

const children = _.times(200, (i) => React.cloneElement(_.sample(PATTERNS), { key: i }))

export default (props) => {
  const {
    style
  } = props

  let className = 'overflow-hidden'
  if (props.className) {
    className += props.className
  }

  return (
    <div key='placeholder'
         className={className}
         style={style}
    >
      <div className='p-4 font-bold'>Loading...</div>

      <div>
        {children}
      </div>
    </div>
  )
}
