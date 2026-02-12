// src/pages/CreateTaskPage.jsx
import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { createTask, getCategories, getTaskTypesByCategory } from "../api/endpoints";

const CreateTaskPage = () => {
  const { token } = useContext(AuthContext);

  const [categories, setCategories] = useState([]);
  const [taskTypes, setTaskTypes] = useState([]);

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  const [categoryId, setCategoryId] = useState("");
  const [taskTypeId, setTaskTypeId] = useState("");

  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingTaskTypes, setLoadingTaskTypes] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    const loadCategories = async () => {
      setLoadingCategories(true);
      setError("");
      try {
        const data = await getCategories();
        if (active) setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        if (active) setError(err?.message || "Failed to load categories.");
      } finally {
        if (active) setLoadingCategories(false);
      }
    };

    loadCategories();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadTaskTypes = async () => {
      if (!categoryId) {
        setTaskTypes([]);
        setTaskTypeId("");
        return;
      }

      setLoadingTaskTypes(true);
      setError("");
      try {
        const data = await getTaskTypesByCategory(categoryId);
        if (active) setTaskTypes(Array.isArray(data) ? data : []);
      } catch (err) {
        if (active) setError(err?.message || "Failed to load task types.");
      } finally {
        if (active) setLoadingTaskTypes(false);
      }
    };

    loadTaskTypes();

    return () => {
      active = false;
    };
  }, [categoryId]);

  const canSubmit = useMemo(
    () =>
      title.trim() &&
      location.trim() &&
      description.trim() &&
      categoryId &&
      taskTypeId &&
      !submitting,
    [title, location, description, categoryId, taskTypeId, submitting]
  );

  const resetForm = () => {
    setTitle("");
    setLocation("");
    setDescription("");
    setCategoryId("");
    setTaskTypeId("");
    setTaskTypes([]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("You need to be logged in to create a task.");
      return;
    }

    if (!canSubmit) {
      setError("Please fill out all fields before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        location: location.trim(),
        description: description.trim(),
        // IMPORTANT: these must be strings (Mongo ObjectIds), not numbers
        category_id: categoryId,
        task_type_id: taskTypeId,
      };

      await createTask(token, payload);
      setSuccess("Task created successfully.");
      resetForm();
    } catch (err) {
      setError(err?.message || "Failed to create task.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-semibold tracking-tight">Create a task</h2>
        <p className="text-sm text-slate-600">
          Tell us what you need, pick a category and task type, and we will match you with the right tasker.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(event) => {
                setCategoryId(event.target.value);
                setTaskTypeId("");
                setTaskTypes([]); // clear stale types instantly
              }}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/70 focus:border-red-500/70"
              disabled={loadingCategories}
              required
            >
              <option value="">
                {loadingCategories ? "Loading categories..." : "Select a category"}
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Task type
            </label>
            <select
              value={taskTypeId}
              onChange={(event) => setTaskTypeId(event.target.value)}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/70 focus:border-red-500/70"
              disabled={!categoryId || loadingTaskTypes}
              required
            >
              <option value="">
                {loadingTaskTypes ? "Loading task types..." : "Select a task type"}
              </option>
              {taskTypes.map((taskType) => (
                <option key={taskType.id} value={taskType.id}>
                  {taskType.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Short summary of the task"
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/70 focus:border-red-500/70"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Neighborhood or address"
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/70 focus:border-red-500/70"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Description
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe what you need done"
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/70 focus:border-red-500/70"
            required
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Creating task..." : "Create task"}
          </button>
          <span className="text-xs text-slate-500">
            {canSubmit ? "Ready to submit." : "Complete all fields to enable submit."}
          </span>
        </div>
      </form>
    </div>
  );
};

export default CreateTaskPage;
