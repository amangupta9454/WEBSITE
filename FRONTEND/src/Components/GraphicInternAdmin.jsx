import React, { useState, useEffect } from "react";
import axios from "axios";

const GraphicInternAdmin = ({ BACKEND_URL, authToken }) => {
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInterns();
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
    try {
      await axios.post(
        `${BACKEND_URL}/api/admin/graphic-submission-status`,
        { userId, internshipId, submissionId, status },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      fetchInterns();
      alert("Submission status updated successfully!");
    } catch (err) {
      console.error("Error updating submission status:", err);
      alert("Failed to update submission status");
    }
  };

  if (loading) return <div className="text-center p-4">Loading Graphic Interns...</div>;
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;

  return (
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
                <div className="bg-white p-3 rounded shadow-sm border flex flex-col gap-2 min-w-[250px]">
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
                              {!sub.link && !sub.fileUrl && <span className="text-gray-400">N/A</span>}
                            </td>
                            <td className="py-2 px-4 border-b text-sm">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${sub.status === 'Reviewed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {sub.status}
                              </span>
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
  );
};

export default GraphicInternAdmin;
