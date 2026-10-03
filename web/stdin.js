// Replaces Emscripten's fd_read so stdin comes from the page's terminal.
// Reading fd 0 pauses the program (Asyncify) until Module.readLine()
// resolves with the next line the user typed. Other fds read the virtual FS.
addToLibrary({
  fd_read__deps: ['$FS', '$SYSCALLS', '$doReadv'],
  fd_read__async: true,
  fd_read: (fd, iov, iovcnt, pnum) => {
    if (fd !== 0) {
      try {
        HEAPU32[pnum >> 2] = doReadv(SYSCALLS.getStreamFromFD(fd), iov, iovcnt);
        return 0;
      } catch (e) {
        if (!(e instanceof FS.ErrnoError)) throw e;
        return e.errno;
      }
    }
    const fill = () => {
      let n = 0;
      for (let i = 0; i < iovcnt; i++) {
        const chunk = Module.stdinBuf.subarray(0, HEAPU32[(iov + i * 8 + 4) >> 2]);
        HEAPU8.set(chunk, HEAPU32[(iov + i * 8) >> 2]);
        Module.stdinBuf = Module.stdinBuf.subarray(chunk.length);
        n += chunk.length;
      }
      HEAPU32[pnum >> 2] = n;
      return 0;
    };
    return Asyncify.handleSleep((wakeUp) => {
      if (Module.stdinBuf?.length) return wakeUp(fill());
      Module.readLine().then((line) => {
        Module.stdinBuf = new TextEncoder().encode(line);
        wakeUp(fill());
      });
    });
  },
});
