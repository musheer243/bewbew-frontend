import React from "react";
import "../../styles/setting.css"; // Assuming your styles are here
import { MdOutlineManageAccounts } from "react-icons/md";
import { RiGitRepositoryPrivateLine } from "react-icons/ri";
import { LuCalendarHeart } from "react-icons/lu";
import { BiBookmarkHeart } from "react-icons/bi";
import { RiHeartsLine } from "react-icons/ri";
import { ImBlocked } from "react-icons/im";
import { IoHeartCircleOutline } from "react-icons/io5";
import { HiTranslate } from "react-icons/hi";
import { LiaHandsHelpingSolid } from "react-icons/lia";


const Settings = () => {
  return (
    <div className="settings-container">
      <h2>Settings</h2>
      <ul className="settings-list">

      <h1 className="settings-title">Your Account</h1>
        <li className="settings-item" data-tooltip="Manage your account settings"><MdOutlineManageAccounts className="icon" size={27} /> Account Setting</li>
        <li className="settings-item" data-tooltip="Adjust your privacy preferences"><RiGitRepositoryPrivateLine className="icon" size={27}/> Account Privacy</li>

        <h1 className="settings-title" style={{marginTop:'30px'}}>Post Activity</h1>
        <li className="settings-item" data-tooltip="The Posts you Liked"><RiHeartsLine className="icon" size={27}/> My Liked </li>
        <li className="settings-item" data-tooltip="Saved Post"><BiBookmarkHeart className="icon" size={27}/> My Saved </li>
        <li className="settings-item" data-tooltip="Manage Schudle Post"><LuCalendarHeart className="icon" size={27}/> My Schudle </li>  

        <h1 className="settings-title" style={{marginTop:'30px'}}>Manage Users</h1> 
        <li className="settings-item" data-tooltip="See blocked users"><ImBlocked className="icon" size={27}/> Blocked</li>
        <li className="settings-item" data-tooltip="Manage your close friends list"><IoHeartCircleOutline className="icon" size={27}/> Close Friends</li>

        <h1 className="settings-title" style={{marginTop:'30px'}}>Language & Support</h1>
        <li className="settings-item" data-tooltip="Change your language"><HiTranslate className="icon" size={27}/> Language</li>
        <li className="settings-item" data-tooltip="Get help & support"><LiaHandsHelpingSolid className="icon" size={27}/> Help</li>
        <li className="settings-item" data-tooltip="Learn more about us" style={{alignItems: "center" , justifyContent: "center", marginTop:'20px'}}> About</li>
      </ul>
    </div>
  );
};

export default Settings;
