import React from "react";
import "../../styles/About.css"; // Assuming your styles are here

const About = () => {
  return (
    <div className="about-container p-6 max-w-3xl mx-auto text-center">
      <h1 className="text-3xl font-bold mb-4">About BewBew</h1>
      <p className="text-lg text-gray-700 mb-6">
        BewBew is a social media platform where users can share their moments, like, comment,
        save posts, and engage with a vibrant community. Built with ReactJS, BewBew offers 
        a seamless and interactive experience for users who love to stay connected.
      </p>
      <div className="mt-6">
        <h2 className="text-2xl font-semibold mb-3">Our Mission</h2>
        <p className="text-lg text-gray-600">
          We aim to create a space where people can freely express themselves, connect with
          friends, and discover new content effortlessly.
        </p>
      </div>
      <div className="mt-6">
        <h2 className="text-2xl font-semibold mb-3">Features</h2>
        <ul className="list-disc list-inside text-gray-600 text-lg">
          <li>Post and share your favorite moments</li>
          <li>Like and comment on posts</li>
          <li>Save posts for later viewing</li>
          <li>Discover trending content</li>
          <li>Engage with a growing community</li>
        </ul>
      </div>
      <div className="mt-6">
        <h2 className="text-2xl font-semibold mb-3">Join Us</h2>
        <p className="text-lg text-gray-600">
          Whether you're here to share your experiences or explore content from others,
          BewBew welcomes you to be a part of our journey!
        </p>
      </div>
    </div>
  );
};

export default About;
