import React, { useState, useEffect, useCallback } from "react";
import { db } from "../firebase/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import Modal from "./Addon/Modal";
import { FaMapMarkerAlt } from "react-icons/fa";

const highlightClass = `
  .highlight {
    background-color: #ffeb3b;
    border-radius: 50%;
  }
  .blocked {
    background-color: #ff4d4d;
    color: white;
    text-decoration: line-through;
  }
`;

const Dashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [date, setDate] = useState(new Date());
  const [blockedDates, setBlockedDates] = useState([]);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const jobsCollection = collection(db, "jobs");
      const jobSnapshot = await getDocs(jobsCollection);
      const jobList = jobSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setJobs(jobList);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setError("Failed to load jobs. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

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

  const markJobAsCompleted = async (jobId) => {
    try {
      const jobRef = doc(db, "jobs", jobId);
      await saveJobWithFormattedDate(jobRef, { completed: true });
      setJobs((prevJobs) =>
        prevJobs.map((job) =>
          job.id === jobId ? { ...job, completed: true } : job
        )
      );
      setSelectedJob((prevJob) => ({ ...prevJob, completed: true }));
    } catch (error) {
      console.error("Error marking job as completed: ", error);
    }
  };

  const jobDates = jobs
    .map((job) => {
      const parsedDate = Date.parse(job.date);
      if (!isNaN(parsedDate)) {
        return new Date(parsedDate).toDateString();
      }
      console.warn("Invalid date found:", job.date);
      return null;
    })
    .filter(Boolean);

  const saveJobWithFormattedDate = async (jobRef, data) => {
    try {
      const formattedDate = new Date(data.date).toISOString().split("T")[0];
      await updateDoc(jobRef, {
        ...data,
        date: formattedDate,
      });
      console.log("Job updated successfully");
    } catch (error) {
      console.error("Error updating job: ", error);
    }
  };

  const normalizeDate = (date) => {
    const parsedDate = typeof date === "string" ? new Date(date) : date;
    return new Date(
      parsedDate.getFullYear(),
      parsedDate.getMonth(),
      parsedDate.getDate()
    );
  };

  const jobsForSelectedDate = jobs.filter((job) => {
    if (job.date) {
      const jobDate = normalizeDate(job.date);
      const selectedDate = normalizeDate(date);
      return jobDate.getTime() === selectedDate.getTime();
    }
    return false;
  });

  const toggleBlockedDate = (date) => {
    const dateString = date.toDateString();
    setBlockedDates((prev) =>
      prev.includes(dateString)
        ? prev.filter((d) => d !== dateString)
        : [...prev, dateString]
    );
  };

  if (loading) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-center mt-8 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <style>{highlightClass}</style>
      <div className="flex flex-col items-center mb-2">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-4 sm:p-6 transition-all hover:shadow-lg">
          <h2 className="text-center text-lg sm:text-xl font-semibold mb-4">
            Calendar
          </h2>
          <div className="flex justify-center">
            <Calendar
              onChange={setDate}
              value={date}
              tileClassName={({ date, view }) => {
                const dateString = date.toDateString();
                if (blockedDates.includes(dateString)) return "blocked";
                return jobDates.includes(dateString) ? "highlight" : null;
              }}
              onClickDay={(value) => {
                if (window.confirm("Do you want to block/unblock this date?")) {
                  toggleBlockedDate(value);
                } else {
                  setDate(value);
                }
              }}
              className="react-calendar w-full"
            />
          </div>
          <p className="text-sm text-center text-gray-600 mt-2">
            Tap a date to block/unblock it
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-4 sm:p-6 transition-all hover:shadow-lg">
          <h2 className="text-center text-lg sm:text-xl font-semibold mb-4">
            Jobs on {date.toLocaleDateString()}
          </h2>
          {jobsForSelectedDate.length > 0 ? (
            <ul className="space-y-2">
              {jobsForSelectedDate.map((job) => (
                <li
                  key={job.id}
                  className="p-2 hover:bg-gray-100 rounded cursor-pointer transition duration-200 ease-in-out"
                  onClick={() => handleJobClick(job)}
                >
                  {job.date || "N/A"} - {job.address || "N/A"}
                </li>
              ))}
            </ul>
          ) : (
            <p>No jobs scheduled for this date.</p>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        {selectedJob && (
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg max-w-md mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold mb-4">Job Details</h2>
            <div className="space-y-2 text-sm sm:text-base">
              <p>
                <strong>Name:</strong> {selectedJob.name || "N/A"}
              </p>
              <p>
                <strong>Date:</strong> {selectedJob.date || "N/A"}
              </p>
              <p>
                <strong>Email:</strong> {selectedJob.email || "N/A"}
              </p>
              <p>
                <strong>Phone:</strong> {selectedJob.phone || "N/A"}
              </p>
              <p>
                <strong>Address:</strong> {selectedJob.address || "N/A"}
              </p>
              {selectedJob.address && (
                <button
                  onClick={() => openInGoogleMaps(selectedJob.address)}
                  className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md text-sm transition duration-200 ease-in-out"
                >
                  <FaMapMarkerAlt className="mr-2" />
                  View in Google Maps
                </button>
              )}
              <p>
                <strong>Info:</strong> {selectedJob.info || "N/A"}
              </p>
              <p>
                <strong>Price:</strong> {selectedJob.price || "N/A"}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                {selectedJob.completed ? "Completed" : "Pending"}
              </p>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0 sm:space-x-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full sm:w-auto bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-200 ease-in-out"
              >
                Close
              </button>
              {!selectedJob.completed && (
                <button
                  onClick={() => markJobAsCompleted(selectedJob.id)}
                  className="w-full sm:w-auto bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition duration-200 ease-in-out"
                >
                  Mark as Completed
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;