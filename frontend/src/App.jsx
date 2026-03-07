import { useState, useEffect, useRef } from "react";
import axios from "axios";

const API = "/api/tasks";

const PRIORITY_CONFIG = {
  low:    { color: "#10b981", bg: "rgba(16,185,129,0.12)", label: "Low" },
  medium: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", label: "Medium" },
  high:   { color: "#ef4444", bg: "rgba(239,68,68,0.12)",  label: "High" },
};

/* ─── Spinner ───────────────────────────────────────────────── */
const Spinner = () => (
  <div style={{
    width: 18, height: 18, border: "2px solid rgba(255,255,255,0.15)",
    borderTop: "2px solid #a855f7", borderRadius: "50%",
    animation: "spin 0.7s linear infinite", display: "inline-block"
  }} />
);

/* ─── TaskCard ───────────────────────────────────────────────── */
function TaskCard({ task, onDelete, onToggle, onEdit, index }) {
  const [deleting, setDeleting] = useState(false);
  const p = PRIORITY_CONFIG[task.priority];

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(task._id);
  };

  return (
    <div style={{
      background: "linear-gradient(135deg, #111118 0%, #16162a 100%)",
      border: `1px solid ${task.completed ? "rgba(42,42,61,0.5)" : "#2a2a3d"}`,
      borderRadius: 16,
      padding: "20px 22px",
      display: "flex",
      alignItems: "flex-start",
      gap: 16,
      animation: `slideIn 0.35s ease ${index * 0.05}s both`,
      transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s",
      cursor: "default",
      opacity: task.completed ? 0.6 : 1,
      position: "relative",
      overflow: "hidden",
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 32px rgba(124,58,237,0.15)";
        e.currentTarget.style.borderColor = "#3d3d5c";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = task.completed ? "rgba(42,42,61,0.5)" : "#2a2a3d";
      }}
    >
      {/* Priority stripe */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
        background: p.color, borderRadius: "16px 0 0 16px", opacity: 0.8
      }} />

      {/* Checkbox */}
      <button onClick={() => onToggle(task)} style={{
        width: 22, height: 22, borderRadius: 6, border: `2px solid ${task.completed ? "#7c3aed" : "#3d3d5c"}`,
        background: task.completed ? "linear-gradient(135deg, #7c3aed, #a855f7)" : "transparent",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, marginTop: 2, transition: "all 0.2s"
      }}>
        {task.completed && <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
          <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>}
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
          <span style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15,
            textDecoration: task.completed ? "line-through" : "none",
            color: task.completed ? "#6b6b8a" : "#f1f0f7",
            transition: "all 0.2s", wordBreak: "break-word"
          }}>{task.title}</span>
          <span style={{
            fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
            color: p.color, background: p.bg, padding: "2px 8px", borderRadius: 99,
          }}>{p.label}</span>
        </div>
        {task.description && (
          <p style={{ fontSize: 13, color: "#8888aa", lineHeight: 1.5, marginBottom: 4 }}>
            {task.description}
          </p>
        )}
        <span style={{ fontSize: 11, color: "#555570" }}>
          {new Date(task.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <IconBtn title="Edit" onClick={() => onEdit(task)} color="#a855f7">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </IconBtn>
        <IconBtn title="Delete" onClick={handleDelete} color="#ef4444" danger>
          {deleting ? <Spinner /> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>}
        </IconBtn>
      </div>
    </div>
  );
}

function IconBtn({ children, onClick, color, danger, title }) {
  const [hov, setHov] = useState(false);
  return (
    <button title={title} onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width: 32, height: 32, borderRadius: 8, border: `1px solid ${hov ? color : "#2a2a3d"}`,
        background: hov ? (danger ? "rgba(239,68,68,0.12)" : "rgba(168,85,247,0.12)") : "transparent",
        color: hov ? color : "#6b6b8a", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.18s"
      }}>
      {children}
    </button>
  );
}

/* ─── Modal ───────────────────────────────────────────────────── */
function Modal({ open, onClose, onSubmit, initial }) {
  const [form, setForm] = useState({ title: "", description: "", priority: "medium" });
  const [loading, setLoading] = useState(false);
  const ref = useRef();

  useEffect(() => {
    if (open) {
      setForm(initial || { title: "", description: "", priority: "medium" });
      setTimeout(() => ref.current?.focus(), 60);
    }
  }, [open, initial]);

  if (!open) return null;

  const handle = async () => {
    if (!form.title.trim()) return;
    setLoading(true);
    await onSubmit(form);
    setLoading(false);
  };

  const isEdit = !!initial?._id;

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16
    }}>
      <div style={{
        background: "linear-gradient(145deg, #13131f, #1a1a2e)",
        border: "1px solid #2a2a3d", borderRadius: 20, padding: 32, width: "100%", maxWidth: 480,
        animation: "fadeUp 0.25s ease both",
        boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.1)"
      }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, marginBottom: 24,
          background: "linear-gradient(90deg, #a855f7, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          {isEdit ? "Edit Task" : "New Task"}
        </h2>

        <label style={labelStyle}>Title *</label>
        <input ref={ref} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          onKeyDown={e => e.key === "Enter" && handle()}
          placeholder="What needs to be done?" style={inputStyle} />

        <label style={labelStyle}>Description</label>
        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Add some details..." rows={3}
          style={{ ...inputStyle, resize: "vertical", minHeight: 80, fontFamily: "inherit" }} />

        <label style={labelStyle}>Priority</label>
        <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
          {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
            <button key={key} onClick={() => setForm(f => ({ ...f, priority: key }))} style={{
              flex: 1, padding: "10px 0", borderRadius: 10, cursor: "pointer", fontWeight: 600,
              fontSize: 13, transition: "all 0.18s", fontFamily: "'Syne', sans-serif",
              border: `1.5px solid ${form.priority === key ? cfg.color : "#2a2a3d"}`,
              background: form.priority === key ? cfg.bg : "transparent",
              color: form.priority === key ? cfg.color : "#6b6b8a",
            }}>{cfg.label}</button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "12px 0", borderRadius: 12, border: "1px solid #2a2a3d",
            background: "transparent", color: "#6b6b8a", cursor: "pointer", fontWeight: 600,
            fontSize: 14, transition: "all 0.18s"
          }}>Cancel</button>
          <button onClick={handle} disabled={loading || !form.title.trim()} style={{
            flex: 2, padding: "12px 0", borderRadius: 12, border: "none",
            background: form.title.trim() ? "linear-gradient(135deg, #7c3aed, #a855f7)" : "#2a2a3d",
            color: form.title.trim() ? "white" : "#555", cursor: form.title.trim() ? "pointer" : "not-allowed",
            fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14,
            boxShadow: form.title.trim() ? "0 4px 20px rgba(124,58,237,0.35)" : "none",
            transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8
          }}>
            {loading ? <><Spinner /> Saving...</> : (isEdit ? "Update Task" : "Add Task")}
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, letterSpacing: "0.06em",
  textTransform: "uppercase", color: "#6b6b8a", marginBottom: 8 };
const inputStyle = {
  width: "100%", padding: "12px 14px", borderRadius: 10,
  border: "1px solid #2a2a3d", background: "#0d0d17", color: "#f1f0f7",
  fontSize: 14, marginBottom: 18, outline: "none", fontFamily: "inherit",
  transition: "border-color 0.18s",
};

/* ─── App ─────────────────────────────────────────────────────── */
export default function App() {
  const [tasks, setTasks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState({ open: false, initial: null });
  const [filter, setFilter]     = useState("all");
  const [search, setSearch]     = useState("");

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    try {
      const { data } = await axios.get(API);
      setTasks(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (form) => {
    try {
      if (modal.initial?._id) {
        const { data } = await axios.put(`${API}/${modal.initial._id}`, form);
        setTasks(t => t.map(x => x._id === data._id ? data : x));
      } else {
        const { data } = await axios.post(API, form);
        setTasks(t => [data, ...t]);
      }
      setModal({ open: false, initial: null });
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    await axios.delete(`${API}/${id}`);
    setTasks(t => t.filter(x => x._id !== id));
  };

  const handleToggle = async (task) => {
    const { data } = await axios.put(`${API}/${task._id}`, { completed: !task.completed });
    setTasks(t => t.map(x => x._id === data._id ? data : x));
  };

  const filtered = tasks
    .filter(t => filter === "all" || (filter === "done" ? t.completed : !t.completed))
    .filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase()));

  const stats = {
    total: tasks.length,
    done: tasks.filter(t => t.completed).length,
    pct: tasks.length ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0
  };

  return (
    <div style={{ minHeight: "100vh", padding: "40px 16px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 40, animation: "fadeUp 0.4s ease both" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 32,
                background: "linear-gradient(90deg, #fff 0%, #c084fc 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                TaskFlow
              </span>
              <div style={{ fontSize: 13, color: "#6b6b8a", marginTop: 2 }}>
                {stats.done} of {stats.total} tasks complete
              </div>
            </div>
            <button onClick={() => setModal({ open: true, initial: null })} style={{
              padding: "12px 22px", borderRadius: 12, border: "none",
              background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "white",
              fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer",
              boxShadow: "0 4px 24px rgba(124,58,237,0.4)", transition: "transform 0.15s, box-shadow 0.15s",
              display: "flex", alignItems: "center", gap: 8
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(124,58,237,0.5)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(124,58,237,0.4)"; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New Task
            </button>
          </div>

          {/* Progress bar */}
          {tasks.length > 0 && (
            <div style={{ height: 4, background: "#1a1a26", borderRadius: 99, marginTop: 16, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 99, width: `${stats.pct}%`,
                background: "linear-gradient(90deg, #7c3aed, #a855f7, #c084fc)",
                transition: "width 0.5s ease", boxShadow: "0 0 8px rgba(168,85,247,0.6)"
              }} />
            </div>
          )}
        </div>

        {/* Search & Filters */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24, animation: "fadeUp 0.4s ease 0.1s both", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 180, position: "relative" }}>
            <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#555570" }}
              width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks…"
              style={{ ...inputStyle, marginBottom: 0, paddingLeft: 36, paddingRight: 14 }} />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[["all","All"], ["active","Active"], ["done","Done"]].map(([val, lbl]) => (
              <button key={val} onClick={() => setFilter(val)} style={{
                padding: "10px 16px", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 13,
                border: `1px solid ${filter === val ? "#7c3aed" : "#2a2a3d"}`,
                background: filter === val ? "rgba(124,58,237,0.15)" : "transparent",
                color: filter === val ? "#a855f7" : "#6b6b8a", transition: "all 0.18s"
              }}>{lbl}</button>
            ))}
          </div>
        </div>

        {/* Task List */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <div style={{ textAlign: "center" }}>
              <Spinner />
              <p style={{ color: "#6b6b8a", marginTop: 12, fontSize: 14 }}>Loading tasks…</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", animation: "fadeUp 0.4s ease both" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>
              {search ? "🔍" : filter === "done" ? "🎉" : "✨"}
            </div>
            <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, color: "#f1f0f7", marginBottom: 8 }}>
              {search ? "No tasks found" : filter === "done" ? "Nothing completed yet" : "No tasks yet"}
            </p>
            <p style={{ color: "#6b6b8a", fontSize: 14 }}>
              {search ? "Try a different search" : "Click 'New Task' to get started"}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((task, i) => (
              <TaskCard key={task._id} task={task} index={i}
                onDelete={handleDelete}
                onToggle={handleToggle}
                onEdit={t => setModal({ open: true, initial: t })}
              />
            ))}
          </div>
        )}

        {/* Stats Footer */}
        {tasks.length > 0 && (
          <div style={{
            display: "flex", justifyContent: "center", gap: 32, marginTop: 36,
            padding: "20px 0", borderTop: "1px solid #1a1a26",
            animation: "fadeUp 0.4s ease 0.2s both"
          }}>
            {[
              { label: "Total", value: stats.total, color: "#a855f7" },
              { label: "Done", value: stats.done, color: "#10b981" },
              { label: "Left", value: stats.total - stats.done, color: "#f59e0b" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 26, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#555570", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, initial: null })}
        onSubmit={handleSubmit}
        initial={modal.initial}
      />
    </div>
  );
}
