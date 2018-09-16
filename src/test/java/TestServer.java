import java.net.InetSocketAddress;

import net.lecousin.framework.application.Application;
import net.lecousin.framework.application.ApplicationBootstrap;
import net.lecousin.framework.application.Artifact;
import net.lecousin.framework.application.Version;
import net.lecousin.framework.concurrent.synch.ISynchronizationPoint;
import net.lecousin.framework.concurrent.synch.SynchronizationPoint;
import net.lecousin.framework.network.http.server.HTTPServerProtocol;
import net.lecousin.framework.network.http.server.processor.StaticProcessor;
import net.lecousin.framework.network.server.TCPServer;
import net.lecousin.framework.progress.WorkProgress;

public class TestServer implements ApplicationBootstrap {

	public static void main(String[] args) {
		ApplicationBootstrap.main(new Artifact("net.lecousin.javascript", "test", new Version("0.1")), args, true, new TestServer());
	}
	
	@Override
	public ISynchronizationPoint<Exception> start(Application app, WorkProgress progress) throws Exception {
		StaticProcessor processor = new StaticProcessor("");
		
		HTTPServerProtocol protocol = new HTTPServerProtocol(processor);
		
		@SuppressWarnings("resource")
		TCPServer server = new TCPServer();
		server.setProtocol(protocol);
		server.bind(new InetSocketAddress("localhost", 12345), 5);
		// neve ending
		return new SynchronizationPoint<>();
	}
	
}
