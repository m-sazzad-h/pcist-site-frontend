import React from 'react';
import { motion } from 'framer-motion';
import ComponentHeader from '../components/ComponentHeader';
import ClubMember from '../components/ClubMember';
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

const Contact = () => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.8, staggerChildren: 0.2 } 
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className='w-full'>
      <ComponentHeader title='Contact' route='Contact' />

      <div className='w-full lg:w-[85%] mx-auto pb-10 px-5 lg:px-0'>

        {/* Contact Info Section */}
        <motion.div 
          className='mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 text-center'
          variants={containerVariants}
          initial='hidden'
          animate='visible'
        >
          <motion.div 
            className='p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow'
            variants={itemVariants}
          >
            <FaPhoneAlt className='mx-auto text-3xl text-orange-500 mb-4' />
            <h3 className='text-xl font-semibold mb-2'>Phone</h3>
            <p className='text-gray-600'>+880 1537-624875</p>
          </motion.div>

          <motion.div 
            className='p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow'
            variants={itemVariants}
          >
            <FaEnvelope className='mx-auto text-3xl text-orange-500 mb-4' />
            <h3 className='text-xl font-semibold mb-2'>Email</h3>
            <p className='text-gray-600'>pcist25@gmail.com</p>
          </motion.div>

          <motion.div 
            className='p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow'
            variants={itemVariants}
          >
            <FaMapMarkerAlt className='mx-auto text-3xl text-orange-500 mb-4' />
            <h3 className='text-xl font-semibold mb-2'>Address</h3>
            <p className='text-gray-600'>House # 54, Road # 15/A(IST Campus), Dhanmondi Dhaka, Bangladesh</p>
          </motion.div>
        </motion.div>

		<ClubMember />
      </div>
    </div>
  );
};

export default Contact;
