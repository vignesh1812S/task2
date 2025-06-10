package com.example.taskapi.controller;

import com.example.taskapi.model.*;
import com.example.taskapi.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.*;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/tasks")
public class TaskController {

    @Autowired
    private TaskRepository repo;

    private boolean isValidCommand(String command) {
        String blacklistRegex = ".*\\b(rm|sudo|wget|curl|reboot|shutdown|kill)\\b.*";
        return !Pattern.compile(blacklistRegex, Pattern.CASE_INSENSITIVE).matcher(command).matches();
    }

    @GetMapping
    public ResponseEntity<?> getTasks(@RequestParam(required = false) String id) {
        if (id == null) return ResponseEntity.ok(repo.findAll());
        return repo.findById(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body("Task not found"));
    }

    @PostMapping
    public ResponseEntity<?> createTask(@RequestBody Task task) {
        if (!isValidCommand(task.getCommand())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Command is not allowed");
        }
        return ResponseEntity.ok(repo.save(task));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTask(@PathVariable String id) {
        if (!repo.existsById(id)) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Task not found");
        repo.deleteById(id);
        return ResponseEntity.ok("Deleted");
    }

    @GetMapping("/search")
    public ResponseEntity<?> findByName(@RequestParam String name) {
        List<Task> tasks = repo.findByNameContainingIgnoreCase(name);
        if (tasks.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("No tasks found");
        return ResponseEntity.ok(tasks);
    }

    @PutMapping("/{id}/execute")
    public ResponseEntity<?> executeCommand(@PathVariable String id) {
        Optional<Task> optionalTask = repo.findById(id);
        if (optionalTask.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Task not found");

        Task task = optionalTask.get();
        if (!isValidCommand(task.getCommand())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Command is not allowed");
        }

        Date start = new Date();
        String output;

        try {
            ProcessBuilder pb = new ProcessBuilder("cmd.exe", "/c", task.getCommand());
            Process process = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder out = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) out.append(line).append("\n");
            process.waitFor();
            output = out.toString();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Execution failed: " + e.getMessage());
        }

        Date end = new Date();
        TaskExecution exec = new TaskExecution();
        exec.setStartTime(start);
        exec.setEndTime(end);
        exec.setOutput(output);
        task.getTaskExecutions().add(exec);
        repo.save(task);
        return ResponseEntity.ok(exec);
    }
}