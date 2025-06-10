// App.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Layout,
  Table,
  Button,
  Input,
  Modal,
  Form,
  message,
  Typography,
  Space,
  Spin,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

interface TaskExecution {
  startTime: string;
  endTime: string;
  output: string;
}

interface Task {
  id: string;
  name: string;
  owner: string;
  command: string;
  taskExecutions: TaskExecution[];
}

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form] = Form.useForm();

  const fetchTasks = async () => {
    try {
      setFetching(true);
      const res = await axios.get("http://localhost:8080/tasks");
      setTasks(res.data);
    } catch (e) {
      message.error("Failed to fetch tasks");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreate = async (values: Omit<Task, "id" | "taskExecutions">) => {
    try {
      setLoading(true);
      await axios.post("http://localhost:8080/tasks", values);
      message.success("Task created");
      fetchTasks();
      setOpen(false);
      form.resetFields();
    } catch (e: any) {
      const msg = e.response?.data || "Error creating task";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`http://localhost:8080/tasks/${id}`);
      message.success("Task deleted");
      fetchTasks();
    } catch {
      message.error("Delete failed");
    }
  };

  const handleExecute = async (id: string) => {
    try {
      const res = await axios.put(`http://localhost:8080/tasks/${id}/execute`);
      message.success("Command executed");
      Modal.info({
        title: "Execution Output",
        content: <pre>{res.data.output}</pre>,
        width: 700,
      });
      fetchTasks();
    } catch (e: any) {
      const msg = e.response?.data || "Execution failed";
      message.error(msg);
    }
  };

  const handleSearch = async () => {
    try {
      const res = await axios.get(`http://localhost:8080/tasks/search?name=${search}`);
      setTasks(res.data);
    } catch {
      message.warning("No tasks found");
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ color: "white", fontSize: 24 }}>Task Manager UI</Header>
      <Content style={{ padding: 24 }}>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="Search by name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 200 }}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchTasks}>Refresh</Button>
          <Button onClick={handleSearch}>Search</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
            New Task
          </Button>
        </Space>

        {fetching ? (
          <Spin />
        ) : (
          <Table
            rowKey="id"
            columns={[
              { title: "Name", dataIndex: "name" },
              { title: "Owner", dataIndex: "owner" },
              { title: "Command", dataIndex: "command" },
              {
                title: "Actions",
                render: (_, task: Task) => (
                  <Space>
                    <Button
                      icon={<PlayCircleOutlined />}
                      onClick={() => handleExecute(task.id)}
                    />
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDelete(task.id)}
                    />
                  </Space>
                ),
              },
            ]}
            dataSource={tasks}
            expandable={{
              expandedRowRender: (task) => (
                <pre style={{ whiteSpace: "pre-wrap" }}>
                  {task.taskExecutions.map(
                    (e, i) =>
                      `#${i + 1}\nStart: ${e.startTime}\nEnd: ${e.endTime}\nOutput:\n${e.output}\n\n`
                  )}
                </pre>
              ),
            }}
            pagination={{ pageSize: 5 }}
          />
        )}

        <Modal
  open={open}
  onCancel={() => {
    setOpen(false);
    form.resetFields(); // Reset form manually
  }}
  onOk={() => form.submit()}
  confirmLoading={loading}
  title="Create Task"
>
  <Form
    form={form}
    layout="vertical"
    onFinish={handleCreate}
    initialValues={{ name: "", owner: "", command: "" }} // Optional: to ensure form initializes properly
  >
    <Form.Item
      name="name"
      label="Task Name"
      rules={[{ required: true, message: "'name' is required" }]}
    >
      <Input />
    </Form.Item>
    <Form.Item
      name="owner"
      label="Owner"
      rules={[{ required: true, message: "'owner' is required" }]}
    >
      <Input />
    </Form.Item>
    <Form.Item
      name="command"
      label="Command"
      rules={[{ required: true, message: "'command' is required" }]}
    >
      <Input />
    </Form.Item>
  </Form>
</Modal>

      </Content>
      <Footer style={{ textAlign: "center" }}>© 2025 Task Manager App</Footer>
    </Layout>
  );
};

export default App;
