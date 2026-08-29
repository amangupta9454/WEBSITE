      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex justify-between items-start p-6 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-4">
                {selectedUser.fullData?.profileImage ? (
                  <img src={selectedUser.fullData.profileImage} alt="Profile" className="w-14 h-14 rounded-2xl object-cover shadow-md" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-bold text-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                    {selectedUser.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                    {selectedUser.name}
                    {selectedUser.isQuizOnly && <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Quiz Only</span>}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-1">
                    <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {selectedUser.email}</span>
                    <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {selectedUser.mobile || "N/A"}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {selectedUser.isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-sm font-semibold text-slate-500">Loading complete profile...</p>
              </div>
            ) : (
              <>
                {/* Tabs */}
                <div className="px-6 pt-4 border-b border-slate-100 flex gap-6 overflow-x-auto shrink-0 scrollbar-hide">
                  {[
                    { id: "profile", label: "Profile", icon: UserCheck },
                    { id: "platform", label: "Platform & Payments", icon: IndianRupee },
                    { id: "internships", label: `Internships (${selectedUser.fullData?.internships?.length || 0})`, icon: Briefcase },
                    { id: "quizzes", label: `Quizzes (${selectedUser.quizzesData?.length || 0})`, icon: BrainCircuit },
                    { id: "projects", label: "Projects & Tasks", icon: BookOpen }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 pb-3 px-1 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                          ? "border-blue-600 text-blue-700"
                          : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                  ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                  {/* Profile Tab */}
                  {activeTab === "profile" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                          <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Account Information</h4>
                          <div className="grid grid-cols-2 gap-y-3 text-sm">
                            <div className="text-slate-500">Role</div>
                            <div className="font-bold text-slate-900 capitalize">{selectedUser.fullData?.role || "User"}</div>
                            <div className="text-slate-500">Status</div>
                            <div className="font-bold text-slate-900">{selectedUser.fullData?.status || "Registered"}</div>
                            <div className="text-slate-500">Joined</div>
                            <div className="font-bold text-slate-900">{selectedUser.fullData?.createdAt ? new Date(selectedUser.fullData.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : "N/A"}</div>
                            <div className="text-slate-500">Referred By</div>
                            <div className="font-bold text-slate-900">{selectedUser.fullData?.referredByCode || "None"}</div>
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                          <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Social Links</h4>
                          <div className="space-y-3">
                            <a href={selectedUser.fullData?.github} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors">
                              <Github className="w-4 h-4 text-slate-400" /> {selectedUser.fullData?.github || "Not provided"}
                            </a>
                            <a href={selectedUser.fullData?.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors">
                              <Linkedin className="w-4 h-4 text-slate-400" /> {selectedUser.fullData?.linkedin || "Not provided"}
                            </a>
                            <a href={selectedUser.fullData?.portfolio} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors">
                              <ExternalLink className="w-4 h-4 text-slate-400" /> {selectedUser.fullData?.portfolio || "Not provided"}
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Platform Tab */}
                  {activeTab === "platform" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm">
                          <div className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">Tokens</div>
                          <div className="text-2xl font-black text-indigo-950">{selectedUser.fullData?.interviewCredits || 0}</div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm">
                          <div className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">Premium Status</div>
                          <div className="text-lg font-black text-amber-950 mt-1">{selectedUser.fullData?.jobPortalPremium ? "Active" : "Inactive"}</div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
                          <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1">Free Resumes</div>
                          <div className="text-2xl font-black text-emerald-950">{selectedUser.fullData?.freeResumesGranted || 0}</div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm">
                          <div className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Synergy Points</div>
                          <div className="text-2xl font-black text-blue-950">{selectedUser.fullData?.synergyPoints || 0}</div>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50">
                          <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                            <IndianRupee className="w-4 h-4 text-emerald-600" /> Razorpay Payments Ledger
                          </h4>
                        </div>
                        {(!selectedUser.fullData?.interviewPayments || selectedUser.fullData.interviewPayments.length === 0) ? (
                          <div className="p-6 text-center text-sm font-medium text-slate-400 italic">No payments recorded.</div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                              <thead>
                                <tr className="bg-white text-slate-400 text-xs uppercase font-bold border-b border-slate-100">
                                  <th className="p-3">Date</th>
                                  <th className="p-3">Package ID</th>
                                  <th className="p-3">Amount</th>
                                  <th className="p-3">Payment ID</th>
                                  <th className="p-3">Order ID</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {selectedUser.fullData.interviewPayments.map((p, i) => (
                                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-3 text-slate-600 font-medium">{new Date(p.paidAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                    <td className="p-3 text-slate-800 font-bold">{p.packageId}</td>
                                    <td className="p-3 text-emerald-600 font-black">₹{p.amount}</td>
                                    <td className="p-3 text-slate-500 font-mono text-xs">{p.razorpayPaymentId}</td>
                                    <td className="p-3 text-slate-500 font-mono text-xs">{p.razorpayOrderId}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Internships Tab */}
                  {activeTab === "internships" && (
                    <div className="space-y-4">
                      {(!selectedUser.fullData?.internships || selectedUser.fullData.internships.length === 0) ? (
                        <div className="p-8 text-center text-sm font-medium text-slate-400 italic bg-white rounded-2xl border border-slate-200">No internship applications found.</div>
                      ) : (
                        selectedUser.fullData.internships.map((app, idx) => (
                          <div key={idx} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                              <h4 className="text-base font-black text-slate-900">{app.domain}</h4>
                              <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-md font-bold text-xs tracking-wider">
                                ID: {app.studentId}
                              </span>
                            </div>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                              <div>
                                <span className="block text-xs font-bold text-slate-400 mb-1">Details</span>
                                <div className="space-y-1.5">
                                  <div className="flex justify-between"><span className="text-slate-500">Duration:</span> <span className="font-bold text-slate-800">{app.duration} Months</span></div>
                                  <div className="flex justify-between"><span className="text-slate-500">Type:</span> <span className="font-bold text-slate-800">{app.internshipType}</span></div>
                                  <div className="flex justify-between"><span className="text-slate-500">Batch:</span> <span className="font-bold text-slate-800">{app.batch || "N/A"}</span></div>
                                  <div className="flex justify-between"><span className="text-slate-500">Applied:</span> <span className="font-bold text-slate-800">{new Date(app.appliedAt).toLocaleDateString('en-GB')}</span></div>
                                </div>
                              </div>
                              <div>
                                <span className="block text-xs font-bold text-slate-400 mb-1">Status</span>
                                <div className="space-y-1.5">
                                  <div className="flex justify-between"><span className="text-slate-500">Payment:</span> <span className={`font-bold ${app.hasPaid ? 'text-emerald-600' : 'text-amber-600'}`}>{app.hasPaid ? `Paid (₹${app.paymentAmount || 0})` : 'Unpaid'}</span></div>
                                  <div className="flex justify-between"><span className="text-slate-500">Offer Letter:</span> <span className="font-bold text-slate-800">{app.offerLetterStatus}</span></div>
                                  <div className="flex justify-between"><span className="text-slate-500">Stipend:</span> <span className={`font-bold ${app.stipendStatus === 'Paid' ? 'text-emerald-600' : 'text-slate-800'}`}>{app.stipendStatus}</span></div>
                                  <div className="flex justify-between"><span className="text-slate-500">Certificate:</span> <span className="font-bold text-slate-800">{app.isCertificateSent ? "Sent" : "Pending"}</span></div>
                                </div>
                              </div>
                              <div className="col-span-full pt-2 mt-2 border-t border-slate-100">
                                <span className="block text-xs font-bold text-slate-400 mb-1">Why Hire?</span>
                                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{app.whyHire || "N/A"}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Quizzes Tab */}
                  {activeTab === "quizzes" && (
                    <div className="space-y-4">
                      {(!selectedUser.quizzesData || selectedUser.quizzesData.length === 0) ? (
                        <div className="p-8 text-center text-sm font-medium text-slate-400 italic bg-white rounded-2xl border border-slate-200">No quizzes found.</div>
                      ) : (
                        selectedUser.quizzesData.map((quiz, idx) => (
                          <div key={idx} className="bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-indigo-50 bg-indigo-50/30 flex justify-between items-center">
                              <h4 className="text-base font-black text-indigo-950">{quiz.quizName}</h4>
                              {quiz.registrationId && (
                                <span className="bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-md font-bold text-xs tracking-wider">
                                  ID: {quiz.registrationId}
                                </span>
                              )}
                            </div>
                            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                              <div><span className="block text-xs font-bold text-slate-400 mb-0.5">Score</span> <div className="font-black text-indigo-900 text-lg">{quiz.score || 0} / {quiz.totalScore || 0}</div></div>
                              <div><span className="block text-xs font-bold text-slate-400 mb-0.5">Percentage</span> <div className="font-black text-indigo-900 text-lg">{quiz.percentage || "N/A"}</div></div>
                              <div><span className="block text-xs font-bold text-slate-400 mb-0.5">Result</span> <div className={`font-black text-lg ${quiz.result === 'Pass' ? 'text-emerald-600' : 'text-rose-600'}`}>{quiz.result || "N/A"}</div></div>
                              <div><span className="block text-xs font-bold text-slate-400 mb-0.5">Imported</span> <div className="font-bold text-slate-700">{quiz.importedAt ? new Date(quiz.importedAt).toLocaleDateString('en-GB') : "N/A"}</div></div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Projects Tab */}
                  {activeTab === "projects" && (
                    <div className="space-y-6">
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50">
                          <h4 className="text-sm font-black text-slate-800">Assigned Repos & Summer Projects</h4>
                        </div>
                        {(!selectedUser.fullData?.internships || selectedUser.fullData.internships.every(i => !i.assignedRepos || i.assignedRepos.length === 0)) ? (
                          <div className="p-6 text-center text-sm font-medium text-slate-400 italic">No assigned projects found.</div>
                        ) : (
                          <div className="p-4 space-y-4">
                            {selectedUser.fullData.internships.map(internship => 
                              internship.assignedRepos?.map((repo, idx) => (
                                <div key={`${internship._id}-${idx}`} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="font-bold text-slate-900">{repo.projectId?.title || "Project ID: " + repo.projectId}</div>
                                    <div className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded">SP: {repo.spAwarded || 0}</div>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600">
                                    <div>Review Status: <strong className="text-slate-900">{repo.reviewStatus}</strong></div>
                                    <div>Final Submitted: <strong className="text-slate-900">{repo.isFinalSubmitted ? "Yes" : "No"}</strong></div>
                                    <div className="col-span-full pt-1">
                                      Link: <a href={repo.repoLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{repo.repoLink}</a>
                                    </div>
                                    {repo.feedback && (
                                      <div className="col-span-full pt-2">
                                        <span className="text-xs font-bold text-slate-400 block mb-1">Feedback:</span>
                                        <div className="text-slate-700 bg-white p-2 rounded border border-slate-200 text-xs">{repo.feedback}</div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
