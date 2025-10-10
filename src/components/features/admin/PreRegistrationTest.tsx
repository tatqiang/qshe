import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { fetchPreRegistrations } from '../../../store/preRegistrationSlice';

export const PreRegistrationTest: React.FC = () => {
  const dispatch = useAppDispatch();
  const preRegistrationState = useAppSelector((state) => state.preRegistration);

  useEffect(() => {
    console.log('PreRegistrationTest: Dispatching fetchPreRegistrations');
    dispatch(fetchPreRegistrations());
  }, [dispatch]);

  console.log('PreRegistrationTest render:', preRegistrationState);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Pre-Registration Test</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="font-bold text-lg mb-2">Redux State:</h2>
        <pre className="whitespace-pre-wrap text-sm">
          {JSON.stringify(preRegistrationState, null, 2)}
        </pre>
      </div>

      <div className="mt-4">
        <h2 className="font-bold text-lg mb-2">Pre-registrations:</h2>
        {preRegistrationState.preRegistrations.map((preReg) => (
          <div key={preReg.id} className="bg-white p-3 border rounded mb-2">
            <p><strong>Email:</strong> {preReg.email}</p>
            <p><strong>Status:</strong> {preReg.status}</p>
            <p><strong>Type:</strong> {preReg.userType}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
