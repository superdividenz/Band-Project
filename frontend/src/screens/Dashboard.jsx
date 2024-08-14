import React, { useState, useEffect } from "react";
import { db } from "../firebase/firebase";
import { collection, getDocs, query, limit } from "firebase/firestore";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import Modal from "../components/Modal";
import styled from "styled-components";
import { FaMapMarkerAlt } from "react-icons/fa";

// Styled button component
const StyledButton = styled.button`
  display: flex;
  align-items: center;
  background-color: #4285f4; /* Google blue color */
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin-top: 10px;

  &:hover {
    background-color: #357ae8; /* Darker blue on hover */
  }

  &:focus {
    outline: none;
  }

  svg {
    margin-right: 5px; /* Space between icon and text */
  }
`;

const Dashboard = () => {
  const [recentjobs, setRecentjobss] = useState([]);
  const [upcomingJobs, setUpcomingJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  const fetchjobsData = async () => {
    try {
      const jobssQuery = query(collection(db, "jobs"), limit(5));
      const jobsSnapshot = await getDocs(jobssQuery);
      const jobsData = jobsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRecentjobss(jobsData);
    } catch (error) {
      console.error("Error fetching jobs data:", error);
    }
  };

  const fetchUpcomingJobs = async () => {
    try {
      const jobsQuery = query(collection(db, "jobs"));
      const jobSnapshot = await getDocs(jobsQuery);
      const jobData = jobSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const upcomingJobs = jobData.filter((job) => {
        const jobDate =
          job.date instanceof Date
            ? job.date
            : new Date(job.date.seconds * 1000);
        return jobDate >= new Date() && jobDate <= nextWeek;
      });
      setUpcomingJobs(upcomingJobs);
    } catch (error) {
      console.error("Error fetching job data:", error);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchjobsData();
    fetchUpcomingJobs();
    setLoading(false);
  }, []);

  const handleJobClick = (job) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const openInGoogleMaps = (address) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
      "_blank"
    );
  };

  const jobDates = upcomingJobs.map((job) => {
    const jobDate =
      job.date instanceof Date ? job.date : new Date(job.date.seconds * 1000);
    return jobDate.toDateString();
  });

  if (loading) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Calendar</h2>
          <Calendar
            onChange={setDate}
            value={date}
            tileClassName={({ date }) => {
              const dateString = date.toDateString();
              return jobDates.includes(dateString) ? "highlight" : null;
            }}
            className="react-calendar"
          />
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Upcoming Jobs Jobs</h2>
          {recentjobs.length > 0 ? (
            <ul>
              {recentjobs.map((job) => (
                <li
                  key={job.id}
                  className="mb-2 cursor-pointer"
                  onClick={() => handleJobClick(job)}
                >
                  {job.date instanceof Date
                    ? job.date.toLocaleDateString()
                    : new Date(
                        job.date.seconds * 1000
                      ).toLocaleDateString()}{" "}
                  {job.lastName} - {job.address}
                </li>
              ))}
            </ul>
          ) : (
            <p>No recent jobs added.</p>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        {selectedJob && (
          <div>
            <h2 className="text-xl font-bold mb-4">Job Details</h2>
            <p>
              <strong>First Name:</strong> {selectedJob.firstName}
            </p>
            <p>
              <strong>Last Name:</strong> {selectedJob.lastName}
            </p>
            <p>
              <strong>Email:</strong> {selectedJob.email}
            </p>
            <p>
              <strong>Address:</strong> {selectedJob.address}
            </p>
            <StyledButton onClick={() => openInGoogleMaps(selectedJob.address)}>
              <FaMapMarkerAlt />
              View in Google Maps
            </StyledButton>
            <p>
              <strong>Time:</strong> {selectedJob.time}
            </p>
            <p>
              <strong>Date:</strong>{" "}
              {selectedJob.date instanceof Date
                ? selectedJob.date.toLocaleDateString()
                : new Date(
                    selectedJob.date.seconds * 1000
                  ).toLocaleDateString()}
            </p>
            <p>
              <strong>Description:</strong> {selectedJob.description}
            </p>
            <p>
              <strong>Yardage:</strong> {selectedJob.yardage}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;
