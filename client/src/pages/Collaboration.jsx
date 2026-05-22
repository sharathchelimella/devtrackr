/**
 * pages/Collaboration.jsx – DevTrackr Team Collaboration & Task Kanban Board
 */

import { useState, useEffect } from 'react';
import {
  Plus, Users, Settings, Trash2, Edit2, Check, X,
  Shield, ShieldAlert, ShieldCheck, UserPlus, Kanban,
  Calendar, ArrowLeft, ArrowRight, ExternalLink,
  AlertTriangle, Info, Save, LogOut, ChevronRight, UserMinus
} from 'lucide-react';
import { teamService } from '../services/teamService';
import { taskService } from '../services/taskService';
import { githubService } from '../services/githubService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Inline GitHub SVG icon
const Github = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
  </svg>
);

const STATUS_COLUMNS = [
  { id: 'backlog',    label: 'Backlog',     color: 'border-slate-500/30 text-slate-400 bg-slate-500/5' },
  { id: 'todo',       label: 'To Do',       color: 'border-blue-500/30 text-blue-400 bg-blue-500/5' },
  { id: 'in_progress', label: 'In Progress', color: 'border-amber-500/30 text-amber-400 bg-amber-500/5' },
  { id: 'review',     label: 'Review',      color: 'border-violet-500/30 text-violet-400 bg-violet-500/5' },
  { id: 'done',       label: 'Done',        color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' }
];

const Collaboration = () => {
  const { user: currentUser } = useAuth();
  
  // State variables
  const [teams, setTeams] = useState([]);
  const [activeTeam, setActiveTeam] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [activeTab, setActiveTab] = useState('board'); // 'board', 'members', 'settings'
  
  // Modals / Dropdowns
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null); // null for new, task object for edit
  
  // Create Team form state
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  
  // Task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskStatus, setTaskStatus] = useState('todo');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskGithubIssue, setTaskGithubIssue] = useState(''); // Stores JSON string of the issue details
  
  // Member invite state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [inviteRole, setInviteRole] = useState('member');
  
  // Team settings state
  const [editTeamName, setEditTeamName] = useState('');
  const [editTeamDesc, setEditTeamDesc] = useState('');
  const [newRepoName, setNewRepoName] = useState('');
  const [teamRepos, setTeamRepos] = useState([]);
  
  // User's sync'd GitHub issues for tasks
  const [githubIssues, setGithubIssues] = useState([]);
  
  // ── Initial Data Fetch ──────────────────────────────────────────────────
  useEffect(() => {
    fetchTeams();
    fetchGithubIssues();
  }, []);

  // Fetch tasks when active team changes
  useEffect(() => {
    if (activeTeam) {
      fetchTasks(activeTeam._id);
      setEditTeamName(activeTeam.name);
      setEditTeamDesc(activeTeam.description || '');
      setTeamRepos(activeTeam.githubRepos || []);
      // Reset member search
      setSearchQuery('');
      setSearchResults([]);
    } else {
      setTasks([]);
    }
  }, [activeTeam]);

  // Fetch teams
  const fetchTeams = async () => {
    setLoadingTeams(true);
    try {
      const { data } = await teamService.getTeams();
      setTeams(data.teams || []);
      if (data.teams && data.teams.length > 0) {
        // Preserving active team selection if possible, otherwise default to first
        const matched = activeTeam ? data.teams.find(t => t._id === activeTeam._id) : null;
        setActiveTeam(matched || data.teams[0]);
      } else {
        setActiveTeam(null);
      }
    } catch (err) {
      toast.error('Failed to load teams');
      console.error(err);
    } finally {
      setLoadingTeams(false);
    }
  };

  // Fetch tasks for the selected team
  const fetchTasks = async (teamId) => {
    setLoadingTasks(true);
    try {
      const { data } = await taskService.getTasksForTeam(teamId);
      setTasks(data.tasks || []);
    } catch (err) {
      toast.error('Failed to load tasks');
      console.error(err);
    } finally {
      setLoadingTasks(false);
    }
  };

  // Fetch logged in user's GitHub issues
  const fetchGithubIssues = async () => {
    try {
      const { data } = await githubService.getIssues();
      setGithubIssues(data.issues || []);
    } catch (err) {
      console.warn('Could not fetch GitHub issues, user might not have GitHub connected');
    }
  };

  // ── Team Operations ──────────────────────────────────────────────────────
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) {
      return toast.error('Team name is required');
    }
    try {
      const { data } = await teamService.createTeam({
        name: newTeamName,
        description: newTeamDesc
      });
      toast.success(data.message || 'Team created successfully');
      setNewTeamName('');
      setNewTeamDesc('');
      setShowCreateTeamModal(false);
      
      // Refresh teams and set new team as active
      const { data: updatedData } = await teamService.getTeams();
      setTeams(updatedData.teams || []);
      const newTeam = updatedData.teams.find(t => t.name === newTeamName) || updatedData.teams[updatedData.teams.length - 1];
      setActiveTeam(newTeam);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create team');
    }
  };

  const handleUpdateTeamSettings = async (e) => {
    e.preventDefault();
    if (!editTeamName.trim()) return toast.error('Team name cannot be empty');
    
    try {
      const { data } = await teamService.updateTeam(activeTeam._id, {
        name: editTeamName,
        description: editTeamDesc,
        githubRepos: teamRepos
      });
      toast.success(data.message || 'Team updated successfully');
      // Refresh active team data
      const updatedTeam = await teamService.getTeamById(activeTeam._id);
      setActiveTeam(updatedTeam.data.team);
      // Refresh list
      const { data: listData } = await teamService.getTeams();
      setTeams(listData.teams || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update team settings');
    }
  };

  const handleDeleteTeam = async () => {
    if (!window.confirm(`Are you absolutely sure you want to delete "${activeTeam.name}"? This will delete all tasks and is permanent!`)) {
      return;
    }
    try {
      const { data } = await teamService.deleteTeam(activeTeam._id);
      toast.success(data.message || 'Team deleted successfully');
      setActiveTeam(null);
      fetchTeams();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete team');
    }
  };

  const handleLeaveTeam = async () => {
    if (!window.confirm(`Are you sure you want to leave the team "${activeTeam.name}"?`)) {
      return;
    }
    try {
      const { data } = await teamService.removeMember(activeTeam._id, currentUser._id);
      toast.success(data.message || 'Left team successfully');
      setActiveTeam(null);
      fetchTeams();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to leave team');
    }
  };

  // ── Member Operations ────────────────────────────────────────────────────
  const handleUserSearch = async (val) => {
    setSearchQuery(val);
    if (!val.trim() || val.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearchingUsers(true);
    try {
      const { data } = await teamService.searchUsers(val);
      // Filter out users who are already in the team
      const existingUserIds = activeTeam.members.map(m => m.user._id);
      const filteredResults = data.users.filter(u => !existingUserIds.includes(u._id));
      setSearchResults(filteredResults);
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleInviteMember = async (userId) => {
    try {
      const { data } = await teamService.addMember(activeTeam._id, userId, inviteRole);
      toast.success(data.message || 'Member invited successfully');
      // Refresh team data
      setActiveTeam(data.team);
      // Remove from search results
      setSearchResults(prev => prev.filter(u => u._id !== userId));
      setSearchQuery('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to invite member');
    }
  };

  const handleRemoveMember = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to remove ${userName} from the team?`)) {
      return;
    }
    try {
      const { data } = await teamService.removeMember(activeTeam._id, userId);
      toast.success(data.message || 'Member removed successfully');
      setActiveTeam(data.team);
      // Refresh tasks in case this member was assigned
      fetchTasks(activeTeam._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleChangeMemberRole = async (userId, newRole) => {
    try {
      const { data } = await teamService.updateMemberRole(activeTeam._id, userId, newRole);
      toast.success(data.message || 'Role updated successfully');
      setActiveTeam(data.team);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update member role');
    }
  };

  // Tracked Repos additions
  const handleAddRepo = (e) => {
    e.preventDefault();
    if (!newRepoName.trim()) return;
    if (!newRepoName.includes('/')) {
      return toast.error('Repo name must be in format: owner/repo');
    }
    if (teamRepos.includes(newRepoName.trim())) {
      return toast.error('Repository is already added');
    }
    setTeamRepos([...teamRepos, newRepoName.trim()]);
    setNewRepoName('');
  };

  const handleRemoveRepo = (repoName) => {
    setTeamRepos(teamRepos.filter(r => r !== repoName));
  };

  // ── Task Operations ──────────────────────────────────────────────────────
  const openNewTaskModal = (initialStatus = 'todo') => {
    setEditingTask(null);
    setTaskTitle('');
    setTaskDesc('');
    setTaskStatus(initialStatus);
    setTaskPriority('medium');
    setTaskAssignee('');
    setTaskDueDate('');
    setTaskGithubIssue('');
    setShowTaskModal(true);
  };

  const openEditTaskModal = (task) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDesc(task.description || '');
    setTaskStatus(task.status);
    setTaskPriority(task.priority);
    setTaskAssignee(task.assignee?._id || '');
    setTaskDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    
    // Find matching synced github issue if set
    if (task.githubIssue && task.githubIssue.number) {
      const match = githubIssues.find(i => i.number === task.githubIssue.number);
      if (match) {
        setTaskGithubIssue(JSON.stringify(match));
      } else {
        setTaskGithubIssue(JSON.stringify(task.githubIssue));
      }
    } else {
      setTaskGithubIssue('');
    }
    setShowTaskModal(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) return toast.error('Task title is required');

    let parsedGithubIssue = undefined;
    if (taskGithubIssue) {
      try {
        const parsed = JSON.parse(taskGithubIssue);
        parsedGithubIssue = {
          number: parsed.number,
          repo: parsed.repo || parsed.repositoryUrl?.split('/repos/')?.[1] || '',
          url: parsed.url || parsed.htmlUrl || ''
        };
      } catch (err) {
        console.error('Failed to parse linked GitHub issue', err);
      }
    }

    const payload = {
      team: activeTeam._id,
      title: taskTitle,
      description: taskDesc,
      status: taskStatus,
      priority: taskPriority,
      assignee: taskAssignee || null,
      githubIssue: parsedGithubIssue || null,
      dueDate: taskDueDate || null
    };

    try {
      if (editingTask) {
        // Update task
        const { data } = await taskService.updateTask(editingTask._id, payload);
        toast.success(data.message || 'Task updated');
        // Update local tasks state
        setTasks(prev => prev.map(t => t._id === editingTask._id ? data.task : t));
      } else {
        // Create task
        const { data } = await taskService.createTask(payload);
        toast.success(data.message || 'Task created');
        setTasks(prev => [data.task, ...prev]);
      }
      setShowTaskModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      const { data } = await taskService.deleteTask(taskId);
      toast.success(data.message || 'Task deleted successfully');
      setTasks(prev => prev.filter(t => t._id !== taskId));
      if (showTaskModal) setShowTaskModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleMoveTaskStatus = async (task, newStatus) => {
    try {
      const { data } = await taskService.updateTask(task._id, {
        ...task,
        status: newStatus,
        assignee: task.assignee?._id || null
      });
      // Update local state instantly
      setTasks(prev => prev.map(t => t._id === task._id ? data.task : t));
    } catch (err) {
      toast.error('Failed to update task column');
    }
  };

  // Helper roles
  const getUserRole = (team, userId) => {
    if (!team) return null;
    const member = team.members.find(m => m.user._id.toString() === userId.toString());
    return member ? member.role : null;
  };

  const userRole = activeTeam ? getUserRole(activeTeam, currentUser._id) : null;
  const isOwner = userRole === 'owner';
  const isAdmin = userRole === 'admin';
  const isOwnerOrAdmin = isOwner || isAdmin;

  // Filter tasks into columns
  const getTasksByStatus = (statusId) => {
    return tasks.filter(t => t.status === statusId);
  };

  // Priority color formatting helper
  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'critical': return 'badge-rose font-semibold border-rose-500/40 text-rose-400 bg-rose-500/10';
      case 'high':     return 'badge-amber border-amber-500/30 text-amber-400 bg-amber-500/10';
      case 'medium':    return 'badge-blue border-blue-500/30 text-blue-400 bg-blue-500/10';
      case 'low':       return 'badge-green border-slate-500/30 text-slate-400 bg-slate-500/10';
      default:          return 'badge-blue border-blue-500/30 text-blue-400 bg-blue-500/10';
    }
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 min-h-[calc(100vh-100px)] animate-fade-in">
      
      {/* ── Left Sidebar: Teams List ────────────────────────────────────────── */}
      <div className="w-full xl:w-72 shrink-0 flex flex-col gap-4">
        <div className="glass-card p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Users size={16} className="text-blue-400" />
              Teams
            </span>
            <button
              onClick={() => setShowCreateTeamModal(true)}
              className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer"
              title="Create Team"
            >
              <Plus size={15} />
            </button>
          </div>

          <div className="h-[px] bg-white/5 my-1" />

          {loadingTeams ? (
            <div className="space-y-2 py-2">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="skeleton h-10 w-full rounded-lg" />
              ))}
            </div>
          ) : teams.length > 0 ? (
            <div className="flex flex-col gap-1.5 max-h-[300px] xl:max-h-none overflow-y-auto pr-1">
              {teams.map((t) => (
                <button
                  key={t._id}
                  onClick={() => {
                    setActiveTeam(t);
                    setActiveTab('board');
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all duration-200 border cursor-pointer ${
                    activeTeam?._id === t._id
                      ? 'bg-blue-600/10 text-white border-blue-500/30 shadow-[inset_0_0_12px_rgba(59,130,246,0.1)]'
                      : 'text-slate-400 hover:text-white hover:bg-white/4 border-transparent'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{t.name}</p>
                    <p className="text-[11px] text-slate-500 truncate -mt-0.5">{t.members?.length} members</p>
                  </div>
                  <ChevronRight size={14} className={activeTeam?._id === t._id ? 'text-blue-400' : 'text-slate-600'} />
                </button>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-slate-500 text-xs">
              No teams joined yet.<br />Create a team to collaborate!
            </div>
          )}
        </div>
      </div>

      {/* ── Right Container: Active Team Workspace ───────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col gap-5">
        {activeTeam ? (
          <>
            {/* Header info */}
            <div className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-tight tracking-tight">
                  {activeTeam.name}
                </h1>
                <p className="text-sm text-slate-400 mt-1 max-w-xl line-clamp-2">
                  {activeTeam.description || 'No description provided.'}
                </p>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-950/40 p-1 rounded-xl border border-white/5 shrink-0 self-start sm:self-center">
                <button
                  onClick={() => setActiveTab('board')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    activeTab === 'board'
                      ? 'bg-blue-600 text-white shadow-glow'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Kanban size={13} />
                  Board
                </button>
                <button
                  onClick={() => setActiveTab('members')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    activeTab === 'members'
                      ? 'bg-blue-600 text-white shadow-glow'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Users size={13} />
                  Members ({activeTeam.members?.length})
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    activeTab === 'settings'
                      ? 'bg-blue-600 text-white shadow-glow'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Settings size={13} />
                  Settings
                </button>
              </div>
            </div>

            {/* TAB CONTENT */}
            <div className="flex-1 min-h-0">
              
              {/* ── TAB 1: KANBAN BOARD ────────────────────────────────────────── */}
              {activeTab === 'board' && (
                <div className="flex flex-col gap-4 h-full">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-400">
                      Manage progress of team tasks. Assign to teammates or link sync'd GitHub issues.
                    </span>
                    <button
                      onClick={() => openNewTaskModal('todo')}
                      className="btn-primary py-2 px-4 text-xs font-bold cursor-pointer shrink-0"
                    >
                      <Plus size={14} />
                      Add Task
                    </button>
                  </div>

                  {loadingTasks ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
                      {Array(5).fill(0).map((_, i) => (
                        <div key={i} className="glass-card p-4 space-y-4 min-h-[400px]">
                          <div className="skeleton h-6 w-1/2" />
                          <div className="skeleton h-28 w-full" />
                          <div className="skeleton h-28 w-full" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 items-start overflow-x-auto pb-4">
                      {STATUS_COLUMNS.map((col) => {
                        const columnTasks = getTasksByStatus(col.id);
                        return (
                          <div
                            key={col.id}
                            className="flex flex-col min-w-[220px] bg-slate-900/60 rounded-xl border border-white/5 p-3 min-h-[500px]"
                          >
                            {/* Column Header */}
                            <div className="flex items-center justify-between mb-3 px-1.5">
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                                {col.label}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${col.color}`}>
                                {columnTasks.length}
                              </span>
                            </div>

                            {/* Task List */}
                            <div className="flex flex-col gap-2.5 flex-grow">
                              {columnTasks.length > 0 ? (
                                columnTasks.map((task) => (
                                  <div
                                    key={task._id}
                                    className="p-3.5 bg-slate-850 hover:bg-slate-800/80 rounded-lg border border-white/5 hover:border-slate-700/60 transition-all duration-200 shadow-sm relative group"
                                  >
                                    {/* Action Buttons Overlay on Hover */}
                                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 flex items-center gap-1.5 transition-opacity">
                                      <button
                                        onClick={() => openEditTaskModal(task)}
                                        className="p-1 rounded bg-slate-900 hover:bg-slate-950 text-slate-400 hover:text-white cursor-pointer"
                                        title="Edit Task"
                                      >
                                        <Edit2 size={11} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteTask(task._id)}
                                        className="p-1 rounded bg-slate-900 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 cursor-pointer"
                                        title="Delete Task"
                                      >
                                        <Trash2 size={11} />
                                      </button>
                                    </div>

                                    {/* Priority Badge */}
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                      <span className={`text-[9px] badge uppercase ${getPriorityBadgeClass(task.priority)}`}>
                                        {task.priority}
                                      </span>
                                      
                                      {/* Due Date Indicator */}
                                      {task.dueDate && (
                                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                          <Calendar size={10} />
                                          {new Date(task.dueDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                                        </span>
                                      )}
                                    </div>

                                    {/* Title */}
                                    <p className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-2 pr-12 cursor-pointer" onClick={() => openEditTaskModal(task)}>
                                      {task.title}
                                    </p>

                                    {/* Description */}
                                    {task.description && (
                                      <p className="text-xs text-slate-400 mt-1.5 line-clamp-3 leading-relaxed">
                                        {task.description}
                                      </p>
                                    )}

                                    {/* GitHub Sync link */}
                                    {task.githubIssue && task.githubIssue.number && (
                                      <a
                                        href={task.githubIssue.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-3 inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 hover:text-white bg-slate-950/40 border border-white/5 rounded-md px-1.5 py-0.5 max-w-full"
                                      >
                                        <Github size={10} className="text-slate-400 shrink-0" />
                                        <span className="truncate max-w-[130px]">
                                          {task.githubIssue.repo?.split('/')?.[1] || task.githubIssue.repo || 'issue'} #{task.githubIssue.number}
                                        </span>
                                        <ExternalLink size={8} className="shrink-0" />
                                      </a>
                                    )}

                                    {/* Divider */}
                                    <div className="h-[1px] bg-white/5 my-3" />

                                    {/* Footer: Assignee & Column Move Indicators */}
                                    <div className="flex items-center justify-between gap-2">
                                      {/* Assignee Avatar */}
                                      <div className="flex items-center gap-2 min-w-0">
                                        {task.assignee ? (
                                          <>
                                            {task.assignee.github?.avatarUrl ? (
                                              <img
                                                src={task.assignee.github.avatarUrl}
                                                alt={task.assignee.name}
                                                className="w-5.5 h-5.5 rounded-full border border-white/10 shrink-0"
                                                title={`Assigned to ${task.assignee.name}`}
                                              />
                                            ) : (
                                              <div
                                                className="w-5.5 h-5.5 rounded-full bg-blue-600/30 text-blue-400 border border-blue-500/20 flex items-center justify-center text-[10px] font-bold shrink-0"
                                                title={`Assigned to ${task.assignee.name}`}
                                              >
                                                {task.assignee.name?.charAt(0).toUpperCase()}
                                              </div>
                                            )}
                                            <span className="text-[11px] text-slate-400 truncate max-w-[90px]" title={task.assignee.name}>
                                              {task.assignee.name.split(' ')[0]}
                                            </span>
                                          </>
                                        ) : (
                                          <span className="text-[10px] text-slate-500 italic">Unassigned</span>
                                        )}
                                      </div>

                                      {/* Board Move Handles */}
                                      <div className="flex items-center gap-1 shrink-0">
                                        <button
                                          disabled={col.id === 'backlog'}
                                          onClick={() => {
                                            const idx = STATUS_COLUMNS.findIndex(c => c.id === col.id);
                                            handleMoveTaskStatus(task, STATUS_COLUMNS[idx - 1].id);
                                          }}
                                          className="p-1 rounded bg-slate-900 hover:bg-slate-950 text-slate-500 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                                          title="Move Left"
                                        >
                                          <ArrowLeft size={10} />
                                        </button>
                                        <button
                                          disabled={col.id === 'done'}
                                          onClick={() => {
                                            const idx = STATUS_COLUMNS.findIndex(c => c.id === col.id);
                                            handleMoveTaskStatus(task, STATUS_COLUMNS[idx + 1].id);
                                          }}
                                          className="p-1 rounded bg-slate-900 hover:bg-slate-950 text-slate-500 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                                          title="Move Right"
                                        >
                                          <ArrowRight size={10} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="py-8 text-center text-slate-600 text-xs italic border border-dashed border-white/5 rounded-lg flex flex-col items-center justify-center p-3">
                                  Empty Column
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── TAB 2: MEMBERS MANAGEMENT ───────────────────────────────────── */}
              {activeTab === 'members' && (
                <div className="flex flex-col lg:flex-row gap-6">
                  
                  {/* Left list */}
                  <div className="flex-1 glass-card p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-white flex items-center gap-2">
                        <Users size={18} className="text-blue-400" />
                        Team Members
                      </span>
                      {activeTeam.owner?._id === currentUser._id && (
                        <span className="text-xs text-amber-400 flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg font-semibold">
                          <ShieldAlert size={12} />
                          Owner View
                        </span>
                      )}
                    </div>
                    
                    <div className="divide-y divide-white/5">
                      {activeTeam.members.map((member) => {
                        const mUser = member.user;
                        if (!mUser) return null;
                        const isSelf = mUser._id.toString() === currentUser._id.toString();
                        const isMemberOwner = mUser._id.toString() === activeTeam.owner._id?.toString();
                        
                        return (
                          <div key={mUser._id} className="py-3.5 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              {mUser.github?.avatarUrl ? (
                                <img src={mUser.github.avatarUrl} alt={mUser.name} className="w-10 h-10 rounded-full border border-white/10" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/25 flex items-center justify-center text-sm font-bold">
                                  {mUser.name?.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold text-white">{mUser.name}</p>
                                  {isSelf && (
                                    <span className="text-[9px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.2 rounded font-semibold">
                                      You
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500">{mUser.email}</p>
                              </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-3">
                              {/* Member Role Display/Edit */}
                              {isOwner && !isMemberOwner ? (
                                <select
                                  value={member.role}
                                  onChange={(e) => handleChangeMemberRole(mUser._id, e.target.value)}
                                  className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                                >
                                  <option value="member">Member</option>
                                  <option value="admin">Admin</option>
                                </select>
                              ) : (
                                <span className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded border flex items-center gap-1.5 ${
                                  member.role === 'owner'
                                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                    : member.role === 'admin'
                                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                    : 'bg-slate-500/10 border-slate-500/20 text-slate-400'
                                }`}>
                                  {member.role === 'owner' ? <ShieldAlert size={10} /> : member.role === 'admin' ? <ShieldCheck size={10} /> : <Shield size={10} />}
                                  {member.role}
                                </span>
                              )}

                              {/* Kick / Leave actions */}
                              {isMemberOwner ? (
                                null
                              ) : isOwner ? (
                                <button
                                  onClick={() => handleRemoveMember(mUser._id, mUser.name)}
                                  className="p-1.5 rounded bg-white/4 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                                  title="Remove Member"
                                >
                                  <UserMinus size={14} />
                                </button>
                              ) : isAdmin && member.role === 'member' ? (
                                <button
                                  onClick={() => handleRemoveMember(mUser._id, mUser.name)}
                                  className="p-1.5 rounded bg-white/4 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                                  title="Remove Member"
                                >
                                  <UserMinus size={14} />
                                </button>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Leave team option */}
                    {!isOwner && (
                      <div className="pt-4 border-t border-white/5 flex justify-end">
                        <button
                          onClick={handleLeaveTeam}
                          className="flex items-center gap-1.5 px-4 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg text-xs font-semibold transition-all duration-200 border border-rose-500/20 cursor-pointer"
                        >
                          <LogOut size={13} />
                          Leave Team
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right invite box (Admins and Owners only) */}
                  {isOwnerOrAdmin ? (
                    <div className="w-full lg:w-96 glass-card p-5 space-y-4 self-start">
                      <span className="text-base font-bold text-white flex items-center gap-2">
                        <UserPlus size={18} className="text-blue-400" />
                        Invite Developer
                      </span>
                      <p className="text-xs text-slate-400">
                        Find members registered on DevTrackr by their name or email address to add them.
                      </p>

                      <div className="space-y-3 pt-2">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Role for new member</label>
                          <select
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value)}
                            className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Search Name / Email</label>
                          <input
                            type="text"
                            placeholder="Type user's name or email..."
                            value={searchQuery}
                            onChange={(e) => handleUserSearch(e.target.value)}
                            className="input-field py-2.5"
                          />
                        </div>

                        {/* Search Results */}
                        <div className="pt-2">
                          {searchingUsers ? (
                            <div className="text-center py-4 text-xs text-slate-400">
                              Searching...
                            </div>
                          ) : searchResults.length > 0 ? (
                            <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                              {searchResults.map((user) => (
                                <div key={user._id} className="flex items-center justify-between p-2 rounded bg-white/4 border border-white/5">
                                  <div className="min-w-0 flex items-center gap-2">
                                    {user.github?.avatarUrl ? (
                                      <img src={user.github.avatarUrl} alt={user.name} className="w-6 h-6 rounded-full" />
                                    ) : (
                                      <div className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center text-[10px] font-bold">
                                        {user.name?.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                    <div className="truncate">
                                      <p className="text-xs font-semibold text-white truncate leading-tight">{user.name}</p>
                                      <p className="text-[10px] text-slate-500 truncate leading-none mt-0.5">{user.email}</p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleInviteMember(user._id)}
                                    className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold cursor-pointer transition-colors"
                                  >
                                    Invite
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : searchQuery.length >= 2 ? (
                            <div className="text-center py-4 text-xs text-slate-500 italic">
                              No matching registered users found.
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full lg:w-96 glass-card p-5 space-y-3 self-start border-amber-500/20 bg-amber-500/3">
                      <div className="flex items-center gap-2 text-amber-400">
                        <Info size={16} />
                        <span className="text-sm font-semibold">Invite Permissions</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Only the team Owner and Admins have permission to search and invite new developers to the team workspace.
                      </p>
                    </div>
                  )}

                </div>
              )}

              {/* ── TAB 3: TEAM SETTINGS ────────────────────────────────────────── */}
              {activeTab === 'settings' && (
                <div className="flex flex-col lg:flex-row gap-6">
                  
                  {/* Info editor */}
                  <div className="flex-1 glass-card p-5 space-y-6">
                    <span className="text-base font-bold text-white flex items-center gap-2">
                      <Settings size={18} className="text-blue-400" />
                      Team Profile settings
                    </span>

                    {isOwnerOrAdmin ? (
                      <form onSubmit={handleUpdateTeamSettings} className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Team Name</label>
                          <input
                            type="text"
                            value={editTeamName}
                            onChange={(e) => setEditTeamName(e.target.value)}
                            className="input-field"
                            placeholder="Enter team name..."
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Team Description</label>
                          <textarea
                            value={editTeamDesc}
                            onChange={(e) => setEditTeamDesc(e.target.value)}
                            className="input-field min-h-[90px] resize-y"
                            placeholder="Describe the team's objectives..."
                            maxLength={250}
                          />
                        </div>

                        {/* Tracked Github repos */}
                        <div className="space-y-2 pt-2">
                          <label className="block text-xs font-semibold text-slate-400 uppercase">Tracked GitHub Repositories</label>
                          <p className="text-[11px] text-slate-500 -mt-1">
                            Link repositories (format: `owner/repo`) to track in team tasks and boards.
                          </p>
                          
                          {/* Repo list */}
                          {teamRepos.length > 0 ? (
                            <div className="flex flex-wrap gap-2 py-2">
                              {teamRepos.map((repo) => (
                                <span
                                  key={repo}
                                  className="badge-blue text-[11px] px-3 py-1 flex items-center gap-2 rounded-lg bg-slate-900 border border-white/10"
                                >
                                  <Github size={12} className="text-slate-400" />
                                  {repo}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveRepo(repo)}
                                    className="hover:text-rose-400 focus:outline-none cursor-pointer"
                                  >
                                    <X size={12} />
                                  </button>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 italic py-1">No repositories tracked yet.</p>
                          )}

                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newRepoName}
                              onChange={(e) => setNewRepoName(e.target.value)}
                              placeholder="e.g. facebook/react"
                              className="input-field py-2"
                            />
                            <button
                              type="button"
                              onClick={handleAddRepo}
                              className="btn-secondary py-2 px-4 text-xs cursor-pointer"
                            >
                              Add
                            </button>
                          </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                          <button
                            type="submit"
                            className="btn-primary text-xs font-bold py-2 px-5 cursor-pointer"
                          >
                            <Save size={14} />
                            Save Changes
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase">Team Name</p>
                          <p className="text-sm font-medium text-white mt-1 bg-white/3 p-3 rounded-lg border border-white/5">{activeTeam.name}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase">Team Description</p>
                          <p className="text-sm text-slate-300 mt-1 bg-white/3 p-3 rounded-lg border border-white/5 min-h-[70px] whitespace-pre-wrap">
                            {activeTeam.description || 'No description provided.'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase">Tracked GitHub Repositories</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {activeTeam.githubRepos?.length > 0 ? (
                              activeTeam.githubRepos.map(repo => (
                                <span key={repo} className="badge-blue text-xs px-3 py-1 bg-slate-900 border border-white/5 rounded-lg">
                                  {repo}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-500 italic">No tracked repositories.</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Zone: Leave/Delete Danger box */}
                  <div className="w-full lg:w-96 shrink-0 flex flex-col gap-4">
                    {/* Delete Team Zone (Owner only) */}
                    {isOwner ? (
                      <div className="glass-card p-5 border-rose-500/20 bg-rose-500/3 space-y-4">
                        <span className="text-base font-bold text-rose-400 flex items-center gap-2">
                          <AlertTriangle size={18} />
                          Danger Zone
                        </span>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Deleting this team will immediately delete all its sprint tasks and remove all members' access. This action is irreversible.
                        </p>
                        <button
                          onClick={handleDeleteTeam}
                          className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs transition-all duration-200 border border-rose-500/30 hover:shadow-glow cursor-pointer"
                        >
                          Delete Team Workspace
                        </button>
                      </div>
                    ) : (
                      <div className="glass-card p-5 border-white/5 bg-slate-900/60 space-y-4">
                        <span className="text-base font-bold text-white flex items-center gap-2">
                          <Info size={18} className="text-blue-400" />
                          Role Details
                        </span>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          You are currently a <span className="font-semibold text-white uppercase">{userRole}</span> in this team.
                          Settings edits are only allowed for Owners and Admins.
                        </p>
                        <button
                          onClick={handleLeaveTeam}
                          className="w-full py-2.5 px-4 bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white font-bold rounded-lg text-xs transition-all duration-200 border border-rose-500/20 cursor-pointer"
                        >
                          Leave Team
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>
          </>
        ) : (
          /* NO TEAMS ACTIVE STATE */
          <div className="flex-1 glass-card p-12 text-center flex flex-col items-center justify-center min-h-[450px]">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
              <Kanban size={32} className="text-blue-400" />
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">devtrackr Collaboration Board</h2>
            <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
              Create a team or ask an existing team owner/admin to invite you using your registered email address. Organize developers, assign tasks, and track issues on a Kanban board.
            </p>
            <button
              onClick={() => setShowCreateTeamModal(true)}
              className="btn-primary mt-6 text-xs font-bold py-2.5 px-6 cursor-pointer"
            >
              <Plus size={14} />
              Create Team Workspace
            </button>
          </div>
        )}
      </div>

      {/* ── CREATE TEAM MODAL ──────────────────────────────────────────────── */}
      {showCreateTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md glass-card p-6 relative border-white/10 shadow-2xl">
            <button
              onClick={() => setShowCreateTeamModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-white mb-1.5 flex items-center gap-2">
              <Users size={18} className="text-blue-400" />
              Create Team Workspace
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Gather developers together. Invite them once the workspace is created.
            </p>

            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Team Name</label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g. Frontend Engineering, Project Dev"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Description (Optional)</label>
                <textarea
                  value={newTeamDesc}
                  onChange={(e) => setNewTeamDesc(e.target.value)}
                  placeholder="Short brief of team objectives..."
                  className="input-field min-h-[80px]"
                  maxLength={200}
                />
              </div>

              <div className="pt-2 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateTeamModal(false)}
                  className="btn-secondary py-2 text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary py-2 text-xs font-bold cursor-pointer"
                >
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CREATE / EDIT TASK MODAL ───────────────────────────────────────── */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg glass-card p-6 relative border-white/10 shadow-2xl">
            <button
              onClick={() => setShowTaskModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Kanban size={18} className="text-blue-400" />
              {editingTask ? 'Edit Task Details' : 'Create Project Task'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {editingTask ? 'Modify sprint details or assignee for the task.' : 'Add a new task item to the project board.'}
            </p>

            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Title</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Design Dashboard UI"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Description (Optional)</label>
                <textarea
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Add bullet points or description..."
                  className="input-field min-h-[70px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Status Column</label>
                  <select
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {STATUS_COLUMNS.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Assignee</label>
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Unassigned</option>
                    {activeTeam.members.map((m) => {
                      if (!m.user) return null;
                      return (
                        <option key={m.user._id} value={m.user._id}>
                          {m.user.name}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Due Date (Optional)</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Link GitHub Sync Issues */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1 flex items-center gap-1">
                  <Github size={12} className="text-slate-400" />
                  Link GitHub Issue (Optional)
                </label>
                {githubIssues.length > 0 ? (
                  <select
                    value={taskGithubIssue}
                    onChange={(e) => setTaskGithubIssue(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Choose Synced Issue to Link --</option>
                    {githubIssues.map((issue) => (
                      <option key={issue.id} value={JSON.stringify(issue)}>
                        #{issue.number} {issue.title} ({issue.repo || 'github'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-[11px] text-slate-500 italic bg-white/3 p-2.5 rounded-lg border border-white/5">
                    No synced GitHub issues found. Ensure GitHub is connected & synced.
                  </p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                {editingTask ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteTask(editingTask._id)}
                    className="px-4 py-2 bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Delete Task
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowTaskModal(false)}
                    className="btn-secondary py-2 text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary py-2 text-xs font-bold cursor-pointer"
                  >
                    Save Task
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Collaboration;
