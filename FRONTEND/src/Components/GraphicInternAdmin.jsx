import React, { useState, useEffect } from "react";
import axios from "axios";
import { Trash2 } from "lucide-react";

const GraphicInternAdmin = ({ BACKEND_URL, authToken }) => {
  const [interns, setInterns] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Resource Form State
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceLink, setResourceLink] = useState("");
  const [resourceFile, setResourceFile] = useState(null);
  const [resourceTarget, setResourceTarget] = useState("All");
  const [resourceTargetUserId, setResourceTargetUserId] = useState("");
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    fetchInterns();
    fetchResources();
  }, []);

  const fetchInterns = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/graphic-interns`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setInterns(response.data.interns || []);
    } catch (err) {
      console.error("Error fetching graphic interns:", err);
      setError("Failed to fetch graphic interns");
    } finally {
      setLoading(false);
    }
  };

  const fetchResources = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/graphic-resources`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setResources(response.data.resources || []);
    } catch (err) {
      console.error("Error fetching graphic resources:", err);
    }
  };

  const handleUpdateStipend = async (userId, internshipId, status, amount) => {
    try {
      await axios.post(
        `${BACKEND_URL}/api/admin/update-stipend`,
        { userId, internshipId, stipendStatus: status, stipendAmount: amount },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      fetchInterns();
      alert("Stipend updated successfully!");
    } catch (err) {
      console.error("Error updating stipend:", err);
      alert("Failed to update stipend");
    }
  };

  const handleUpdateSubmissionStatus = async (userId, internshipId, submissionId, status) => {
    let spPoints = null;
    if (status === 'Reviewed') {
      const pointsStr = window.prompt("Enter SP Points for this submission (0-10):");
      if (pointsStr === null) return; // cancelled
      const points = parseInt(pointsStr, 10);
      if (isNaN(points) || points < 0 || points > 10) {
        alert("Please enter a valid number between 0 and 10.");
        return;
      }
      spPoints = points;
    }

    try {
      await axios.post(
        `${BACKEND_URL}/api/admin/graphic-submission-status`,
        { userId, internshipId, submissionId, status, spPoints },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      fetchInterns();
      alert("Submission status updated successfully!");
    } catch (err) {
      console.error("Error updating submission status:", err);
      alert("Failed to update submission status");
    }
  };

  const handleShareResource = async (e) => {
    e.preventDefault();
    if (!resourceTitle) return alert("Title is required");
    
    setSharing(true);
    const formData = new FormData();
    formData.append("title", resourceTitle);
    formData.append("link", resourceLink);
    formData.append("target", resourceTarget);
    if (resourceTarget === "Specific") {
      formData.append("targetUserId", resourceTargetUserId);
    }
    if (resourceFile) {
      formData.append("file", resourceFile);
    }

    try {
      await axios.post(`${BACKEND_URL}/api/admin/graphic-resource`, formData, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      alert("Resource shared successfully!");
      setResourceTitle("");
      setResourceLink("");
      setResourceFile(null);
      setResourceTarget("All");
      setResourceTargetUserId("");
      fetchResources();
    } catch (err) {
      console.error(err);
      alert("Failed to share resource");
    } finally {
      setSharing(false);
    }
  };

  const handleDeleteResource = async (id) => {
    if (!window.confirm("Are you sure you want to delete this resource?")) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/admin/graphic-resource/${id}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      fetchResources();
    } catch (err) {
      console.error("Error deleting resource:", err);
      alert("Failed to delete resource");
    }
  };

  if (loading) return <div className="text-center p-4">Loading Graphic Interns...</div>;
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;

  return (
    <div className="space-y-6">
      {/* Manage Resources Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Manage Graphic Resources</h2>
        <form onSubmit={handleShareResource} className="bg-gray-50 p-4 rounded-lg border mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Resource Title *</label>
            <input type="text" className="w-full border rounded p-2" value={resourceTitle} onChange={e => setResourceTitle(e.target.value)} required placeholder="e.g. Company Logo" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Resource Link</label>
            <input type="url" className="w-full border rounded p-2" value={resourceLink} onChange={e => setResourceLink(e.target.value)} placeholder="e.g. Google Drive Link" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Upload File</label>
            <input type="file" className="w-full border rounded p-1.5 bg-white" onChange={e => setResourceFile(e.target.files[0])} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Target Intern</label>
            <select className="w-full border rounded p-2" value={resourceTarget} onChange={e => {
              setResourceTarget(e.target.value);
              if (e.target.value === "All") setResourceTargetUserId("");
            }}>
              <option value="All">All Graphic Designers</option>
              <option value="Specific">Specific Intern</option>
            </select>
          </div>
          {resourceTarget === "Specific" && (
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-1">Select Specific Intern *</label>
              <select className="w-full border rounded p-2" value={resourceTargetUserId} onChange={e => setResourceTargetUserId(e.target.value)} required={resourceTarget === "Specific"}>
                <option value="">-- Select Intern --</option>
                {interns.map(i => <option key={i.userId} value={i.userId}>{i.name} ({i.studentId})</option>)}
              </select>
            </div>
          )}
          <div className="md:col-span-2">
            <button type="submit" disabled={sharing} className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700 disabled:opacity-50">
              {sharing ? "Sharing..." : "Share Resource"}
            </button>
          </div>
        </form>

        <div>
          <h3 className="font-semibold text-lg mb-3">Shared Resources</h3>
          {resources.length === 0 ? <p className="text-gray-500 text-sm">No resources shared yet.</p> : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border rounded text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-2 px-4 border-b text-left">Date</th>
                    <th className="py-2 px-4 border-b text-left">Title</th>
                    <th className="py-2 px-4 border-b text-left">Target</th>
                    <th className="py-2 px-4 border-b text-left">Link/File</th>
                    <th className="py-2 px-4 border-b text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map(res => (
                    <tr key={res._id} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border-b">{new Date(res.createdAt).toLocaleDateString()}</td>
                      <td className="py-2 px-4 border-b font-medium">{res.title}</td>
                      <td className="py-2 px-4 border-b">
                        <span className={`px-2 py-1 rounded text-xs ${res.target === 'All' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                          {res.target === 'All' ? 'All Graphic Designers' : 'Specific Intern'}
                        </span>
                      </td>
                      <td className="py-2 px-4 border-b">
                        {res.link && <a href={res.link} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline block">View Link</a>}
                        {res.fileUrl && <a href={res.fileUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline block">View File</a>}
                      </td>
                      <td className="py-2 px-4 border-b">
                        <button onClick={() => handleDeleteResource(res._id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Graphic Designer Submissions & Stipend</h2>
        
        {interns.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No Graphic Design interns found.</p>
        ) : (
          <div className="space-y-8">
            {interns.map((intern) => (
              <div key={intern.internshipId} className="border rounded-lg p-6 bg-gray-50">
                <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">{intern.name}</h3>
                    <p className="text-sm text-gray-600">ID: {intern.studentId} | Email: {intern.email} | Mobile: {intern.mobile}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setResourceTarget("Specific");
                        setResourceTargetUserId(intern.userId);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded text-sm font-semibold border border-purple-200 hover:bg-purple-200"
                    >
                      + Share Resource
                    </button>
                    <div className="bg-white p-3 rounded shadow-sm border flex flex-col gap-2 min-w-[200px]">
                      <label className="text-sm font-semibold text-gray-700">Stipend Status:</label>
                      <select 
                        className="border rounded p-1 text-sm"
                        value={intern.stipendStatus}
                        onChange={(e) => handleUpdateStipend(intern.userId, intern.internshipId, e.target.value, intern.stipendAmount)}
                      >
                        <option value="Unpaid">Unpaid</option>
                        <option value="Paid">Paid</option>
                      </select>

                      {intern.stipendStatus === 'Paid' && (
                        <>
                          <label className="text-sm font-semibold text-gray-700 mt-2">Monthly Amount (₹):</label>
                          <input 
                            type="number" 
                            className="border rounded p-1 text-sm w-full"
                            value={intern.stipendAmount || ''}
                            onChange={(e) => {
                              const updatedInterns = [...interns];
                              const idx = updatedInterns.findIndex(i => i.internshipId === intern.internshipId);
                              updatedInterns[idx].stipendAmount = e.target.value;
                              setInterns(updatedInterns);
                            }}
                            onBlur={(e) => handleUpdateStipend(intern.userId, intern.internshipId, intern.stipendStatus, e.target.value)}
                            placeholder="e.g. 5000"
                          />
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-semibold text-lg mb-3">Submissions</h4>
                  {intern.graphicSubmissions && intern.graphicSubmissions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border rounded">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">Date</th>
                            <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">Work Link/File</th>
                            <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">Status</th>
                            <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {intern.graphicSubmissions.map((sub, idx) => (
                            <tr key={sub._id || idx} className="hover:bg-gray-50">
                              <td className="py-2 px-4 border-b text-sm">
                                {new Date(sub.submittedAt).toLocaleString()}
                              </td>
                              <td className="py-2 px-4 border-b text-sm">
                                {sub.link && (
                                  <a href={sub.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline block">
                                    View Link
                                  </a>
                                )}
                                {sub.fileUrl && (
                                  <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline block mt-1">
                                    View File
                                  </a>
                                )}
                                {sub.fileUrls && sub.fileUrls.map((url, fIdx) => (
                                  <a key={fIdx} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline block mt-1">
                                    View File {fIdx + 1}
                                  </a>
                                ))}
                                {!sub.link && !sub.fileUrl && (!sub.fileUrls || sub.fileUrls.length === 0) && <span className="text-gray-400">N/A</span>}
                                
                                <div className="mt-2 space-y-1 max-w-xs">
                                  {sub.linkedinCaption && (
                                    <div className="text-xs bg-white p-2 rounded border border-gray-200">
                                      <span className="font-semibold text-blue-700 block mb-1">LinkedIn Caption:</span>
                                      <span className="text-gray-600 break-words line-clamp-3" title={sub.linkedinCaption}>{sub.linkedinCaption}</span>
                                    </div>
                                  )}
                                  {sub.instagramCaption && (
                                    <div className="text-xs bg-white p-2 rounded border border-gray-200">
                                      <span className="font-semibold text-pink-700 block mb-1">Instagram Caption:</span>
                                      <span className="text-gray-600 break-words line-clamp-3" title={sub.instagramCaption}>{sub.instagramCaption}</span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="py-2 px-4 border-b text-sm">
                                <span className={`px-2 py-1 rounded text-xs ${sub.status === 'Reviewed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                  {sub.status}
                                </span>
                                {sub.spPoints !== undefined && sub.spPoints !== null && (
                                  <div className="mt-1 text-xs font-bold text-purple-700">
                                    SP: {sub.spPoints}/10
                                  </div>
                                )}
                              </td>
                              <td className="py-2 px-4 border-b text-sm">
                                {sub.status === 'Pending' && (
                                  <button 
                                    onClick={() => handleUpdateSubmissionStatus(intern.userId, intern.internshipId, sub._id, 'Reviewed')}
                                    className="text-white bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded text-xs"
                                  >
                                    Mark Reviewed
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No submissions yet.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GraphicInternAdmin;
