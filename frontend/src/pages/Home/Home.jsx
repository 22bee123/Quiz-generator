import React, {useLayoutEffect, useRef} from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import Particles from '../../components/Particles/Particles'
import Spline from '@splinetool/react-spline';

const Home = () => {
  const navigate = useNavigate()
  const comp = useRef(null)

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      const t1 = gsap.timeline()
      t1.from("#intro-slider", {
        xPercent: -100,
        duration: 1.3,
        delay: 0.3,
        ease: "power2.inOut"
      }).from(["#title-1", "#title-2", "#title-3"],{
        opacity: 0,
        y: 100,
        stagger: 0.5,
      }).to(["#title-1", "#title-2", "#title-3"], {
        opacity: 0,
        y: -50,
        duration: 0.3,
       stagger: 0.5,
      }).from(["#member-1", "#member-2", "#member-3", "#member-4", "#member-5"], {
        opacity: 0,
        y: 100,
        stagger: 0.5,
      }).to("#intro-slider", {
        xPercent: -100,
        duration: 1.3,
        ease: "power2.inOut",
        delay: 1,
      }).from("#spline",{
        opacity: 0,
        duration: 3,
        ease: "power2.inOut",
        scale:2
      }).to("#spline",{
        duration: 1.3,
        ease: "power2.inOut",
        scale:1,
        x:600,
        y:100,
      }).from(["#welcome-1", "#welcome-2", "#welcome-3", "#welcome-4", "#welcome-5"], {
        opacity: 0,
        y: 100,
        duration: 1.3,
        ease: "power2.inOut",
        stagger: 0.5,
      }).from("#nav", {
        opacity: 0,
        y: 100,
        duration: 1.3,
        ease: "power2.inOut",
      }).from(["#nav-1", "#nav-2", "#nav-3"], {
        opacity: 0,
        y: 100,
        duration: 1.3,
        ease: "power2.inOut",
        stagger: 0.5,
      })






    }, comp)
    return () => ctx.revert()
  }, [])

  return (
    <div className='relative' ref={comp}>
      
      
      <div id="intro-slider" className='h-screen p-10 bg-gray-50 absolute top-0 left-0 font-spaceGrotesk z-10 w-full flex flex-col gap-10 tracking-tighter'>
          <h1 id="title-1" className='text-gray-900 text-9xl font-bold p-10'>Quiz Generator</h1>
          <h1 id="title-2" className='text-gray-900 text-9xl font-bold p-10'>Using AI</h1>  
          <h1 id="title-3" className='text-gray-900 text-9xl font-bold p-10'>3-CPE-B</h1>

         <div className='absolute left-0 top-0 p-10 flex flex-col gap-10'>
           <h1 id="member-1" className='text-gray-900 text-4xl font-bold'>Members:</h1>
          <h1 id="member-2" className='text-gray-900 text-2xl font-bold'>Paul Kian Gipulan</h1>
          <h1 id="member-3" className='text-gray-900 text-2xl font-bold'>James Fedrick Aragon</h1>
          <h1 id="member-4" className='text-gray-900 text-2xl font-bold'>Dirk Osnof Pillas</h1>
          <h1 id="member-5" className='text-gray-900 text-2xl font-bold'>Erth Sean Paolo Bacaresas</h1>
         </div>
         
    
          
      </div>
      

      <Particles/>
      <Spline id='spline' className=' pt-30 absolute top-0 left-0 w-full h-full' scene="https://prod.spline.design/JL7YrbMAKC05gOnS/scene.splinecode" />

      <div className='h-screen flex flex-col gap-10  bg-[#DDDDD5] justify-center place-items-center'>
          <h1 id="welcome-1" className='text-[#262626] text-9xl font-bold font-spaceGrotesk'>Welcome to Quiz </h1>
          <h1 id="welcome-2" className='text-[#262626] text-9xl font-bold font-spaceGrotesk'>Generator.</h1>
          <p id="welcome-3" className='text-[#262626] text-2xl font-semibold font-spaceGrotesk'>Transform Learning with Our Quiz Generator</p>
          <button id="welcome-4" onClick={() => navigate('/login')} className='bg-[#262626] text-gray-100 px-8 py-3 rounded-sm text-lg font-semibold hover:bg-[#4d4d4d] hover:text-gray-900 transition-colors'>Get Started</button>
          <p id="welcome-5" className='relative text-[#262626] text-xs font-semibold font-spaceGrotesk top-30'>Our AI can make mistakes. Check important info.</p>
      </div>

      <nav id="nav" className="fixed top-0 left-0 w-full bg-[#DDDDD5] shadow-md p-2 z-20">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-[#262626] text-xl font-bold font-spaceGrotesk">Quiz Generator</div>
          <ul className="flex space-x-8">

            <li id="nav-1"><a href="#" className="text-[#262626] hover:text-[#4d4d4d] font-spaceGrotesk">Home</a></li>
            <li id="nav-2"><a href="#" className="text-[#262626] hover:text-[#4d4d4d] font-spaceGrotesk">About</a></li>
            <li id="nav-3"><a href="#" className="text-[#262626] hover:text-[#4d4d4d] font-spaceGrotesk">Contact</a></li>
          </ul>
          <button 

            onClick={() => navigate('/login')} 
            className="bg-[#262626] text-gray-100 px-6 py-2 rounded-sm text-lg font-semibold hover:bg-[#4d4d4d] transition-colors font-spaceGrotesk"
          >
            Login
          </button>
        </div>
      </nav>



      


































    
      {/* <nav className="bg-white shadow-md p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-xl font-bold">Quiz Generator</div>
          <ul className="flex space-x-4">
            <li><a href="#" className="hover:text-blue-600">Members</a></li>
            <li><a href="#" className="hover:text-blue-600">About us</a></li>
          </ul>
          <div className="space-x-4">

            <button onClick={() => navigate('/login')}  className="bg-blue-600 text-white px-6 py-2 rounded-sm text-lg font-semibold hover:bg-blue-700 transition-colors" onClick={() => navigate('/login')}>join</button>
          </div>

        </div>
      </nav>

   
      <div className=" min-h-[80vh] flex flex-row items-center justify-center px-4">
        <div className='flex flex-col items-start justify-center px-4 w-1/2'>
          <h1 className="text-6xl font-bold mb-4">Transform Learning with Our Quiz Generator</h1>

          <p className="text-xl text-gray-600 mb-8 max-w-2xl">
          Unlock the power of interactive quizzes with our innovative API. Create engaging assessments that captivate and educate effortlessly.
          </p>
          <button 
            onClick={() => navigate('/login')} 
            className="bg-blue-600 text-white px-8 py-3 rounded-sm text-lg font-semibold hover:bg-blue-700 transition-colors"
          >
          Get Started
          </button>
        </div>
        <div className='h-full w-auto' >
          <img className='w-200' src="/picture.svg"/>
        </div>
      </div> */}

    </div>

  )
}

export default Home
