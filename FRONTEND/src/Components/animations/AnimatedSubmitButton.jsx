import React from 'react';
import { BorderTrail } from './BorderTrail';

export function AnimatedSubmitButton({ 
  isLoading, 
  onClick, 
  children, 
  className = '', 
  type = 'button',
  disabled = false
}) {
  return (
    <div className={`relative rounded-md ${className}`}>
      {isLoading && (
        <BorderTrail
          className='bg-gradient-to-l from-green-300 via-green-500 to-green-300 opacity-100'
          size={120}
          transition={{
            ease: [0, 0.5, 0.8, 0.5],
            duration: 2,
            repeat: Infinity,
          }}
        />
      )}
      <button
        className='relative flex h-full w-full items-center justify-center'
        type={type}
        disabled={disabled || isLoading}
        onClick={onClick}
      >
        {children}
      </button>
    </div>
  );
}
